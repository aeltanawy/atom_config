"use strict";

const {realpath, normalisePath} = require("./utils.js");
const EntityType = require("./entity-type.js");
const Resource = require("./resource.js");


class Directory extends Resource {
	
	constructor(path, stats){
		super(path, stats);
		path = this.realPath || this.path;
		
		// Root directory/Project folder
		for(const root of atom.project.rootDirectories)
			if(root && path === normalisePath(root.path)){
				this.isRoot = true;
				break;
			}
	}
	
	
	setRepository(to){
		this.isRepository = false;
		this.isSubmodule = false;
		
		if(super.setRepository(to) && this.repo){
			const repoType = this.repo.getType();
			const path = realpath(this.realPath || this.path);
			
			if("git" === repoType){
				const {repo} = this.repo;
				if(repo.isWorkingDirectory(path))
					this.isRepository = true;
				
				submoduleSearch:
				for(const superRepo of atom.project.repositories){
					if(!superRepo || "git" !== superRepo.getType())
						continue;
					
					const {submodules} = superRepo.repo;
					for(const submodule of Object.values(submodules))
						if(path === realpath(submodule.workingDirectory)){
							this.isSubmodule = true;
							this.submodule = submodule;
							break submoduleSearch;
						}
				}
			}
			
			else{
				const repoPath = this.repo.workingDirectory || this.repo.path;
				if(path === normalisePath(repoPath))
					this.isRepository = true;
				if(!repoPath){
					const {path, repo} = this;
					console.error(`Unknown VCS: ${repoType}`, {path, repo});
				}
			}
		}
	}
}

Object.assign(Directory.prototype, {
	type: EntityType.DIRECTORY,
	isDirectory: true,
	
	/**
	 * Whether the directory represents the working directory of a {GitRepository}
	 * @property {Boolean} isRepository
	 */
	isRepository: false,
	
	/**
	 * Whether the directory represents a submodule registered by the containing repository.
	 * @property {Boolean} isSubmodule
	 */
	isSubmodule: false,

	/**
	 * Whether the directory is the root of an opened project.
	 * @property {Boolean} isRoot
	 */
	isRoot: false,
});

module.exports = Directory;
