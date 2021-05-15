Change Log
==========

This project adheres to [Semantic Versioning](http://semver.org).

[Staged]: https://github.com/file-icons/atom-fs/compare/v0.2.1...HEAD


[v0.2.1](https://github.com/file-icons/atom-fs/releases/tag/v0.2.1)
------------------------------------------------------------------------
**March 12th, 2021**  
* Fixed breakage caused by mixing BigInts with other types [[`#10`][]].

[`#10`]: https://github.com/file-icons/atom-fs/issues/10


[v0.2.0](https://github.com/file-icons/atom-fs/releases/tag/v0.2.0)
------------------------------------------------------------------------
**December 6th, 2020**  
* Added support for recognising repositories in subfolders [[`#9`][]].
* Fixed [broken handling][2] of very large inode values.
* Resources are now [uniquely identified][2] by device number and inode.

[`#9`]: https://github.com/file-icons/atom-fs/issues/9
[2]: ../../commit/3e1a85c3a532e1170ebbcdb41ce0a025f4eb98de


[v0.1.6](https://github.com/file-icons/atom-fs/releases/tag/v0.1.6)
------------------------------------------------------------------------
**September 14th, 2018**  
* Transferred repository to `file-icons` organisation on GitHub
* Upgraded [`mapped-disposable`][] dependency to [`v1.0.2`][1]

[`mapped-disposable`]: https://github.com/file-icons/mapped-disposable
[1]: https://github.com/file-icons/mapped-disposable/releases/tag/v1.0.2


[v0.1.5](https://github.com/file-icons/atom-fs/releases/tag/v0.1.5)
------------------------------------------------------------------------
**August 13th, 2018**  
* Inlined helper functions previously imported from [`alhadis.utils`][].
* Removed event logging from system-task queue.
* Added [`normalisePath`][] function to exports list.

[`alhadis.utils`]: https://github.com/Alhadis/Utils
[`normalisePath`]: ../../blob/1b3ba49/lib/utils.js#L43-L61


[v0.1.4](https://github.com/file-icons/atom-fs/releases/tag/v0.1.4)
------------------------------------------------------------------------
**November 20th, 2017**  
Added the auxiliary [`PathMap`][] class to normalise paths consistently.

[`PathMap`]: ./lib/path-map.js


[v0.1.3](https://github.com/file-icons/atom-fs/releases/tag/v0.1.3)
------------------------------------------------------------------------
**August 17th, 2017**  
Fixed a regression with reading the contents of opened text-buffers.


[v0.1.2](https://github.com/file-icons/atom-fs/releases/tag/v0.1.2)
------------------------------------------------------------------------
**August 17th, 2017**  
Fixed an oversight where the wrong object was globalised at entry point.


[v0.1.0](https://github.com/file-icons/atom-fs/releases/tag/v0.1.0)
------------------------------------------------------------------------
**March 21st, 2017**  
Initial release of filesystem API decoupled from [`file-icons`][].

[`file-icons`]: https://github.com/file-icons/atom
