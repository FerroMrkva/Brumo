class NodeCollectionSelector(Selector):
  def __init__(self, selector, collection):
      Selector.__init__(self, selector)
      self._collection=collection

      if self._selector_type == 'id':
         self._match=self._match_id
      elif self._selector_type =='tag':
         self._match=self._match_tag
      elif self._selector_type == 'classname':
         self._match=self._match_classname

  def _match_id(self, node):
      if node.id is None: return False
      return node.id == self._selector

  def _match_tag(self, node):
      return node.tagName == self._selector

  def _match_classname(self, node):
      return self._selector in node.classname

  def get(self):
      _c1=NodeCollection()
      for _node in self._collection:
          if self._match(_node):
             _c1.append(_node)

      return _c1

class Selector:
  tags=['A','ABBR','ACRONYM','ADDRESS','APPLET','B','BDO','BIG','BLOCKQUOTE',
        'BUTTON','CAPTION','CENTER','CITE','CODE','DEL','DFN','DIR','DIV','DL',
        'EM','FIELDSET','FONT','FORM','FRAMESET','H1','H2','H3','H4','H5','H6',
        'I','IFRAME','INS','KBD','LABEL','LEGEND','MAP','MENU','NOFRAMES', 
        'NOSCRIPT','OBJECT','OL','OPTGROUP','PRE','Q','S','SAMP','SCRIPT', 
        'SELECT','SMALL','SPAN','STRIKE','STRONG','STYLE','SUB','SUP','TABLE',
        'TEXTAREA','TITLE','TT','U','UL','VAR','BODY','COLGROUP','DD','DT',
        'HEAD','HTML','LI','P','TBODY','OPTION','TD','TFOOT','TH','THEAD','TR',
        'AREA','BASE','BASEFONT','BR','COL','FRAME','HR','IMG','INPUT',
        'ISINDEX','LINK','META','PARAM',  #HTML 5 elements...
        'ARTICLE','ASIDE','FIGURE','FOOTER','HEADER','NAV','SECTION','AUDIO',
        'VIDEO','CANVAS','COMMAND','DATALIST','DETAILS','OUTPUT','PROGRESS',
        'HGROUP','MARK','METER','TIME','RP','RT','RUBY']

  def __init__(self, selector, start_node=doc):
      self._doc=start_node

      if (isinstance(selector, str)):
         if selector.startswith("."):   #class selector
            self._selector=selector[1:]
            self._selector_type="classname"
         elif selector.startswith("#"):  #id selector
            self._selector=selector[1:]
            self._selector_type="id"
         elif selector.upper() in tags:
            self._selector=selector.upper()
            self._selector_type="tag"
         else:  
            self._selector=selector
            self._selector_type="selector"
      else:  #this is a function
         self._selector_type="selector"
         self._function=selector
         self.get=self._function_get

  def _function_get(self):
      def recurse(node):
          _list=[]
          if self._function(node):
             _list.append(node)

          for _node in node.childNodes:
              _list+=recurse(_node)

          return _list

      _matched_nodes=recurse(self._doc)
      return NodeCollection(_matched_nodes)

  def get(self):
      _matched_nodes=[]
      
      if self._selector_type=="id":
         _matched_nodes=self._doc.get(id=self._selector)
      elif self._selector_type=="classname":
         _matched_nodes=self._doc.get(classname=self._selector)
      elif self._selector_type == "tag":
         _matched_nodes=self._doc.get(tag=self._selector)
      elif self._selector_type=="selector":
         _matched_nodes=self._doc.get(selector=self._selector)

      return NodeCollection(_matched_nodes)

class NodeCollection:
  def __init__(self, nodes=[]):
      self._nodes=nodes

  def __len__(self):
      return len(self._nodes)

  def __item__(self, i):
      return self._nodes[i]

  def __add__(self, nodes):
      self._nodes+=nodes

  def __str__(self):
      _str=[]
      for _node in self._nodes:
          _str.append(_node.__str__())

      return '<br>'.join(_str)

  def append(self, node):        
      self._nodes.append(node)

  def next(self):
      for _node in self._nodes:
          yield _node

  def add(self, selector, context):
      _ns=NodeCollectionSelector(selector, self)
      self._nodes+=_ns.get()

  def addClass(self, classname):
      for _node in self._nodes:
          _node.addClass(classname)

  def after(self, content):
      for _node in self._nodes:
          _node.after(content)

  def append_content(self, content):
      for _node in self._nodes:
          _node.append(content)

  def before(self, content):
      for _node in self._nodes:
          _node.before(content)

  def children(self, selector=None):
      _c=NodeCollection()
      for _node in self._nodes:
          for _child in _node.get_children():
              _c.append(_child)

      if selector is None:
         return _c

      #selector is not None
      _ns=NodeCollectionSelector(selector, _c)
      return _ns.get()

  def clone(self):
      return NodeCollection([_node.clone() for _node in self._nodes])

  def closest(self, selector):
      if isinstance(selector, str):
         _ns=Selector(selector)
         selector=_ns.get()

      _c=NodeCollection()
      for _node in self._nodes:
          _c.append(_node.closest(selector))

      return _c

  def css(self, property, value=None):
      if value is None and not isinstance(property, dict):
         return self._nodes[0].css(property)

      if isinstance(property, dict):
         for _node in self._nodes:
             _node.css(property)
      else:
         for _node in self._nodes:
             _node.css(property, value)
      
  def empty(self):
      for _node in self._nodes:
          _node.empty()

  def filter(self, selector):
      _ns=NodeCollectionSelector(selector, self)
      return _ns.get()

  def first(self):
      if len(self._nodes) == 0:
         return NodeCollection()

      return NodeCollection([self._nodes[0]])

  def get(self, index=None):
      if index is None:
         return [_node for _node in self._nodes]

      return self._nodes[index]

  def hasClass(self, name):
      for _node in self._nodes:
          if _node.hasClass(name):
             return True

      return False

  def height(self, value=None):
      if value is None:
         return self._nodes[0].css('height')

      for _node in self._nodes:
          _node.set_style({'height': value})

  def hide(self):
      for _node in self._nodes:
          _node.set_style({'display': 'none'})

  def html(self, content=None):
      if content is None:
         return self._nodes[0].get_html()

      for _node in self._nodes:
          _node.set_html(content)

  def last(self):
      return self._nodes[-1]

  def parent(self):
      _p=NodeCollection()
      for _node in self._nodes:
          _p.append(_node.get_parent())

  def prepend(self, content):
      for _node in self._nodes:
          _node.prepend(content)

  def prev(self):
      _p1=NodeCollection()
      for _node in self._nodes:
          _parent=_node.get_parent()
          for _i in range(len(_parent.childNodes)):
              if _parent.childNodes[_i] == _node:
                 if _i > 0:
                    _p1.append(_parent.childNodes[_i-1])
                 break

      return _p1

  def remove(self):
      for _node in self._nodes:
          _node.get_parent().removeChild(_node) 

  def removeClass(self, name):
      for _node in self._nodes:
          _node.removeClass(name)

  def replaceWith(self, content):
      for _node in self._nodes:
          _node.get_parent().replaceWith(content, _node)

  def show(self):
      for _node in self._nodes:
          _node.set_style({'display': 'block'})

  def text(self, content=None):
      if content is None:
         return self._nodes[0].get_text()

      for _node in self._nodes:
          _node.set_text(content) 

  def toggle(self, Function=None):
      if Function is None:
         _show=True
         if self._nodes[0].css('display') != 'none':
            _show=False
         for _node in self._nodes:
             if _show:
                _node.set_style({'display': 'block'})
             else:
                _node.set_style({'display': 'none'})
  
             _show=not _show

         return

      for _node in self._nodes:
          if Function(_node):
             _node.set_style({'display': 'block'})
          else:
             _node.set_style({'display': 'none'})

  def unwrap(self):
      for _node in self._nodes:
          _parent=_node.get_parent()
          _grandparent=_parent.get_parent()
          _grandparent.replaceChild(_node, _parent)

          _parent.remove()

  def width(self, width=None):
      if width is None:
         return self._nodes[0].css('width')

      for _node in self._nodes:
          _node.set_style({'width': width})
