__stdout__=getattr(doc,"$stdout")
__stderr__=getattr(doc,"$stderr")

stdout = getattr(doc,"$stdout")
stderr = getattr(doc,"$stderr")

modules=__BRYTHON__.modules

has_local_storage=__BRYTHON__.has_local_storage
has_json=__BRYTHON__.has_json
version_info=__BRYTHON__.version_info
path=__BRYTHON__.path
builtin_module_names=['posix']

byteorder='little'
maxsize=9007199254740992   #largest integer..
