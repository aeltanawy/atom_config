"use strict";

const {basename} = require("path");
const {CompositeDisposable, Directory, Disposable, Emitter} = require("atom");
const {lstat, realpath, statify, normalisePath} = require("./utils.js");
const MappedDisposable = require("mapped-disposable");
const EntityType = require("./entity-type.js");
const System = require("./system.js");


/**
 * A filesystem resource.
 *
 * @class
 */
class Resource{
	
	/**
	 * Initialise a new resource.
	 *
	 * @param {String}    path - Absolute pathname of resource
	 * @param {fs.Stats} stats - Filesystem stats returned by {@link fs.lstatSync} or {@link statify}.
	 * @constructor
	 */
	constructor(path, stats){
		path = normalisePath(path);
		
		this.disposables = new MappedDisposable();
		this.emitter = new Emitter();
		this.path = path;
		this.name = basename(path);
		this.consumeStats(stats);
		
		this.getRepository().then(repo => this.setRepository(repo));
	}

	
	/**
	 * Obliterate resource from memory.
	 *
	 * @emits did-destroy
	 */
	destroy(){
		if(!this.destroyed){
			this.destroyed = true;
			this.unwatchRepo();
			this.emit("did-destroy");
			this.emitter.dispose();
			this.disposables.dispose();
			this.disposables = null;
			this.emitter = null;
		}
	}
	

	/* Event subscription */
	onDidDestroy         (fn){ return this.subscribe("did-destroy",           fn); }
	onDidMove            (fn){ return this.subscribe("did-move",              fn); }
	onDidChangeRepository(fn){ return this.subscribe("did-change-repository", fn); }
	onDidChangeVCSStatus (fn){ return this.subscribe("did-change-vcs-status", fn); }
	onDidLoadStats       (fn){ return this.subscribe("did-load-stats",        fn); }
	onDidChangeRealPath  (fn){ return this.subscribe("did-change-realpath",   fn); }


	/**
	 * Return the resource's path when stringified.
	 *
	 * @return {String}
	 */
	toString(){
		return this.path || "";
	}
	
	
	/**
	 * Subscribe to an event, avoiding breakage if emitter is absent.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Disposable}
	 */
	subscribe(event, fn){
		return this.emitter
			? this.emitter.on(event, fn)
			: new Disposable();
	}
	
	
	/**
	 * Dispatch an event, avoiding breakage if emitter is absent.
	 *
	 * @param {String} event
	 * @param {Mixed} value
	 */
	emit(event, value){
		if(this.emitter)
			this.emitter.emit(event, value);
	}
	
	
	/**
	 * Process the contents of an {@link fs.Stats} instance.
	 *
	 * If given a falsey value, the resource is marked unreadable.
	 *
	 * @param {fs.Stats} stats
	 * @private
	 */
	consumeStats(stats){
		if(this.destroyed) return;
		
		if(stats){
			this.pendingStats = false;
			this.stats = stats;
			this.type = EntityType.ALL & Number(stats.mode);
			
			// Identify resource uniquely, if possible
			if(stats.ino){
				const {dev, ino} = stats;
				this.id = dev ? `${dev}.${ino}` : String(ino);
			}
			
			if(stats.isSymbolicLink())
				this.isSymlink = true;
			
			this.emit("did-load-stats", stats);
		}
		else this.unreadable = true;
	}
	
	
	/**
	 * Load the resource's absolute physical pathname.
	 *
	 * @param {Boolean} asap - Load synchronously
	 * @emits did-change-realpath
	 */
	loadRealPath(asap = false){
		if(this.destroyed) return;
		
		if(asap)
			this.setRealPath(realpath(this.path));
		
		else{
			if(this.pendingRealPath)
				return;
			
			this.pendingRealPath = true;
			System.loadRealPath(this.path).then(result => {
				this.setRealPath(result);
			});
		}
	}
	
	
	/**
	 * Load stats from the filesystem.
	 *
	 * @param {Boolean} asap - Load synchronously
	 * @emits did-load-stats
	 */
	loadStats(asap = false){
		if(this.destroyed) return;
		
		if(asap)
			this.consumeStats(lstat(this.path));
		
		else{
			if(this.pendingStats)
				return;
			
			this.pendingStats = true;
			System.loadStats(this.path).then(result => {
				this.consumeStats(statify(result));
			});
		}
	}
	
	
	/**
	 * Whether the resource's permission bits enable it to be executed.
	 *
	 * If permission bits haven't been determined, the property's value is null.
	 *
	 * @readonly
	 * @return {Boolean|null}
	 */
	get executable(){
		return this.stats
			? !!(0o111 & Number(this.stats.mode))
			: null;
	}
	
	
	/**
	 * Return a handle to the repository this resource belongs to.
	 *
	 * @return {Promise<GitRepository>|null}
	 */
	getRepository(){
		if(this.destroyed) return null;
		const directory = new Directory(this.realPath || this.path);
		return atom.project.repositoryForDirectory(directory);
	}
	
	
	/**
	 * Retrieve the submodule to which this resource belongs.
	 *
	 * @return {Repository}
	 */
	getSubmodule(){
		if(!this.repo || this.destroyed) return null;
		const {repo} = this.repo;
		return repo.submoduleForPath(this.path) || null;
	}
	
	
	/**
	 * Modify the resource's location.
	 *
	 * @param {String} to
	 * @throws {TypeError} Path cannot be empty
	 * @emits did-move
	 */
	setPath(to){
		if(this.destroyed) return null;
		if(!to) throw new TypeError("Cannot assign empty path");
		const from = this.path;
		
		to = normalisePath(to);
		if(from !== to){
			this.path = to;
			this.name = basename(to);
			this.emit("did-move", {from, to});
		}
	}
	
	
	/**
	 * Modify a symlinked resource's destination.
	 *
	 * TODO: Move all realPath-related shite to a dedicated subclass for symlinks.
	 *
	 * @param {String} to
	 * @emits did-change-realpath
	 */
	setRealPath(to){
		if(this.destroyed) return null;
		this.pendingRealPath = false;
		const from = this.realPath;
		
		to = normalisePath(to);
		if(to !== from && to !== this.realPath){
			this.realPath = to;
			setImmediate(() => this.emit("did-change-realpath", {from, to}));
		}
	}
	
	
	/**
	 * Store a reference to the repository this resource belongs to.
	 *
	 * @param {GitRepository} to
	 * @emits did-change-repository
	 * @return {Boolean} Whether a change of repository was made.
	 */
	setRepository(to){
		if(this.destroyed) return null;
		const from = this.repo;
		to = to || null;
		
		if(from !== to){
			this.repo = to;
			this.watchRepo();
			setImmediate(() => this.emit("did-change-repository", {from, to}));
			return true;
		}
		
		return false;
	}
	
	
	/**
	 * Modify the VCS status code of this resource.
	 *
	 * @param {Number} to
	 * @emits did-change-vcs-status
	 */
	setVCSStatus(to){
		if(this.destroyed) return null;
		const from = this.vcsStatus;
		
		if(from !== to){
			this.vcsStatus = to;
			this.emit("did-change-vcs-status", {from, to});
		}
	}
	
	
	/**
	 * Monitor changes made to the resource's VCS status.
	 */
	watchRepo(){
		if(this.destroyed) return null;
		const {repo} = this;
		
		if(repo && !this.watchingRepo){
			this.watchingRepo = true;
			this.setVCSStatus(repo.getCachedPathStatus(this.path) || 0);
			this.disposables.set("repo", new CompositeDisposable(
				repo.onDidDestroy(() => this.unwatchRepo()),
				repo.onDidChangeStatuses(() => {
					const path = this.realPath || this.path;
					const code = repo.getCachedPathStatus(path) || 0;
					this.setVCSStatus(code);
				}),
				repo.onDidChangeStatus(changed => {
					if(changed.path === (this.realPath || this.path))
						this.setVCSStatus(changed.pathStatus);
				})
			));
		}
	}
	
	
	/**
	 * Stop monitoring the resource's repository for status changes.
	 */
	unwatchRepo(){
		if(this.destroyed) return null;
		if(this.watchingRepo){
			this.watchingRepo = false;
			this.disposables.dispose("repo");
		}
	}
}

Object.assign(Resource.prototype, {
	destroyed: false,
	id: null,
	isDirectory: false,
	isFile: false,
	isSymlink: false,
	isVirtual: false,
	pendingRealPath: false,
	pendingStats: false,
	realPath: null,
	repo: null,
	stats: null,
	submodule: null,
	type: 0,
	unreadable: false,
	vcsStatus: 0,
	watchingRepo: false,
});

module.exports = Resource;
