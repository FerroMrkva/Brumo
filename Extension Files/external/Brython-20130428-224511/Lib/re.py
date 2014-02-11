I = 'i'

class MatchObject:

    def __init__(self,jsmatch):
        self._jsmatch = jsmatch

    def group(self, *args):
        # FIXME: Support for group names ?
        if len(args) == 0:
            return self._jsmatch[0]
        elif len(args) == 1:
            return self._jsmatch[args[0]]
        else:
            return tuple(self._jsmatch[x] for x in args)

    def groups(self, default_=None):
        if default_ is None:
            return tuple(self._jsmatch[1:])
        else:
            return tuple(x if x is not None else default_ 
                         for x in self._jsmatch[1:])

def search(pattern,src,flags=None):
    # FIXME : Check whether `g` is appropriate as this is used for match too
    flag = 'g'
    if flags:
        flag += flags
    jsmatch = __BRYTHON__.re(pattern,flag).exec(src)
    if not jsmatch:
        return None
    else:
        mo = MatchObject(jsmatch)
        # FIXME : move to MatchObject.__init__
        mo.string = src
        return mo

def match(pattern, src, flags=None):
    if pattern[0] != '^':
        pattern = '^' + pattern
    return search(pattern, src, flags)


