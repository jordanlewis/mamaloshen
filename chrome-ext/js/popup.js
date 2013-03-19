var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__8744__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__8744 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8744__delegate.call(this, array, i, idxs)
    };
    G__8744.cljs$lang$maxFixedArity = 2;
    G__8744.cljs$lang$applyTo = function(arglist__8745) {
      var array = cljs.core.first(arglist__8745);
      var i = cljs.core.first(cljs.core.next(arglist__8745));
      var idxs = cljs.core.rest(cljs.core.next(arglist__8745));
      return G__8744__delegate(array, i, idxs)
    };
    G__8744.cljs$lang$arity$variadic = G__8744__delegate;
    return G__8744
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3546__auto____8746 = this$;
      if(and__3546__auto____8746) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____8746
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____8747 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8747) {
          return or__3548__auto____8747
        }else {
          var or__3548__auto____8748 = cljs.core._invoke["_"];
          if(or__3548__auto____8748) {
            return or__3548__auto____8748
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____8749 = this$;
      if(and__3546__auto____8749) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____8749
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____8750 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8750) {
          return or__3548__auto____8750
        }else {
          var or__3548__auto____8751 = cljs.core._invoke["_"];
          if(or__3548__auto____8751) {
            return or__3548__auto____8751
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____8752 = this$;
      if(and__3546__auto____8752) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____8752
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____8753 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8753) {
          return or__3548__auto____8753
        }else {
          var or__3548__auto____8754 = cljs.core._invoke["_"];
          if(or__3548__auto____8754) {
            return or__3548__auto____8754
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____8755 = this$;
      if(and__3546__auto____8755) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____8755
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____8756 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8756) {
          return or__3548__auto____8756
        }else {
          var or__3548__auto____8757 = cljs.core._invoke["_"];
          if(or__3548__auto____8757) {
            return or__3548__auto____8757
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____8758 = this$;
      if(and__3546__auto____8758) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____8758
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____8759 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8759) {
          return or__3548__auto____8759
        }else {
          var or__3548__auto____8760 = cljs.core._invoke["_"];
          if(or__3548__auto____8760) {
            return or__3548__auto____8760
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____8761 = this$;
      if(and__3546__auto____8761) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____8761
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____8762 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8762) {
          return or__3548__auto____8762
        }else {
          var or__3548__auto____8763 = cljs.core._invoke["_"];
          if(or__3548__auto____8763) {
            return or__3548__auto____8763
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____8764 = this$;
      if(and__3546__auto____8764) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____8764
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____8765 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8765) {
          return or__3548__auto____8765
        }else {
          var or__3548__auto____8766 = cljs.core._invoke["_"];
          if(or__3548__auto____8766) {
            return or__3548__auto____8766
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____8767 = this$;
      if(and__3546__auto____8767) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____8767
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____8768 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8768) {
          return or__3548__auto____8768
        }else {
          var or__3548__auto____8769 = cljs.core._invoke["_"];
          if(or__3548__auto____8769) {
            return or__3548__auto____8769
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____8770 = this$;
      if(and__3546__auto____8770) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____8770
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____8771 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8771) {
          return or__3548__auto____8771
        }else {
          var or__3548__auto____8772 = cljs.core._invoke["_"];
          if(or__3548__auto____8772) {
            return or__3548__auto____8772
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____8773 = this$;
      if(and__3546__auto____8773) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____8773
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____8774 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8774) {
          return or__3548__auto____8774
        }else {
          var or__3548__auto____8775 = cljs.core._invoke["_"];
          if(or__3548__auto____8775) {
            return or__3548__auto____8775
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____8776 = this$;
      if(and__3546__auto____8776) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____8776
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____8777 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8777) {
          return or__3548__auto____8777
        }else {
          var or__3548__auto____8778 = cljs.core._invoke["_"];
          if(or__3548__auto____8778) {
            return or__3548__auto____8778
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____8779 = this$;
      if(and__3546__auto____8779) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____8779
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____8780 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8780) {
          return or__3548__auto____8780
        }else {
          var or__3548__auto____8781 = cljs.core._invoke["_"];
          if(or__3548__auto____8781) {
            return or__3548__auto____8781
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____8782 = this$;
      if(and__3546__auto____8782) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____8782
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____8783 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8783) {
          return or__3548__auto____8783
        }else {
          var or__3548__auto____8784 = cljs.core._invoke["_"];
          if(or__3548__auto____8784) {
            return or__3548__auto____8784
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____8785 = this$;
      if(and__3546__auto____8785) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____8785
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____8786 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8786) {
          return or__3548__auto____8786
        }else {
          var or__3548__auto____8787 = cljs.core._invoke["_"];
          if(or__3548__auto____8787) {
            return or__3548__auto____8787
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____8788 = this$;
      if(and__3546__auto____8788) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____8788
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____8789 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8789) {
          return or__3548__auto____8789
        }else {
          var or__3548__auto____8790 = cljs.core._invoke["_"];
          if(or__3548__auto____8790) {
            return or__3548__auto____8790
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____8791 = this$;
      if(and__3546__auto____8791) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____8791
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____8792 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8792) {
          return or__3548__auto____8792
        }else {
          var or__3548__auto____8793 = cljs.core._invoke["_"];
          if(or__3548__auto____8793) {
            return or__3548__auto____8793
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____8794 = this$;
      if(and__3546__auto____8794) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____8794
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____8795 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8795) {
          return or__3548__auto____8795
        }else {
          var or__3548__auto____8796 = cljs.core._invoke["_"];
          if(or__3548__auto____8796) {
            return or__3548__auto____8796
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____8797 = this$;
      if(and__3546__auto____8797) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____8797
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____8798 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8798) {
          return or__3548__auto____8798
        }else {
          var or__3548__auto____8799 = cljs.core._invoke["_"];
          if(or__3548__auto____8799) {
            return or__3548__auto____8799
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____8800 = this$;
      if(and__3546__auto____8800) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____8800
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____8801 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8801) {
          return or__3548__auto____8801
        }else {
          var or__3548__auto____8802 = cljs.core._invoke["_"];
          if(or__3548__auto____8802) {
            return or__3548__auto____8802
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____8803 = this$;
      if(and__3546__auto____8803) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____8803
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____8804 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8804) {
          return or__3548__auto____8804
        }else {
          var or__3548__auto____8805 = cljs.core._invoke["_"];
          if(or__3548__auto____8805) {
            return or__3548__auto____8805
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____8806 = this$;
      if(and__3546__auto____8806) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____8806
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____8807 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____8807) {
          return or__3548__auto____8807
        }else {
          var or__3548__auto____8808 = cljs.core._invoke["_"];
          if(or__3548__auto____8808) {
            return or__3548__auto____8808
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3546__auto____8809 = coll;
    if(and__3546__auto____8809) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____8809
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8810 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8810) {
        return or__3548__auto____8810
      }else {
        var or__3548__auto____8811 = cljs.core._count["_"];
        if(or__3548__auto____8811) {
          return or__3548__auto____8811
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3546__auto____8812 = coll;
    if(and__3546__auto____8812) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____8812
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8813 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8813) {
        return or__3548__auto____8813
      }else {
        var or__3548__auto____8814 = cljs.core._empty["_"];
        if(or__3548__auto____8814) {
          return or__3548__auto____8814
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3546__auto____8815 = coll;
    if(and__3546__auto____8815) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____8815
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____8816 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8816) {
        return or__3548__auto____8816
      }else {
        var or__3548__auto____8817 = cljs.core._conj["_"];
        if(or__3548__auto____8817) {
          return or__3548__auto____8817
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3546__auto____8818 = coll;
      if(and__3546__auto____8818) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____8818
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____8819 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____8819) {
          return or__3548__auto____8819
        }else {
          var or__3548__auto____8820 = cljs.core._nth["_"];
          if(or__3548__auto____8820) {
            return or__3548__auto____8820
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____8821 = coll;
      if(and__3546__auto____8821) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____8821
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____8822 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____8822) {
          return or__3548__auto____8822
        }else {
          var or__3548__auto____8823 = cljs.core._nth["_"];
          if(or__3548__auto____8823) {
            return or__3548__auto____8823
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3546__auto____8824 = coll;
    if(and__3546__auto____8824) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____8824
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8825 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8825) {
        return or__3548__auto____8825
      }else {
        var or__3548__auto____8826 = cljs.core._first["_"];
        if(or__3548__auto____8826) {
          return or__3548__auto____8826
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____8827 = coll;
    if(and__3546__auto____8827) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____8827
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8828 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8828) {
        return or__3548__auto____8828
      }else {
        var or__3548__auto____8829 = cljs.core._rest["_"];
        if(or__3548__auto____8829) {
          return or__3548__auto____8829
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3546__auto____8830 = o;
      if(and__3546__auto____8830) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____8830
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____8831 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____8831) {
          return or__3548__auto____8831
        }else {
          var or__3548__auto____8832 = cljs.core._lookup["_"];
          if(or__3548__auto____8832) {
            return or__3548__auto____8832
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____8833 = o;
      if(and__3546__auto____8833) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____8833
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____8834 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____8834) {
          return or__3548__auto____8834
        }else {
          var or__3548__auto____8835 = cljs.core._lookup["_"];
          if(or__3548__auto____8835) {
            return or__3548__auto____8835
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3546__auto____8836 = coll;
    if(and__3546__auto____8836) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____8836
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____8837 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8837) {
        return or__3548__auto____8837
      }else {
        var or__3548__auto____8838 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____8838) {
          return or__3548__auto____8838
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____8839 = coll;
    if(and__3546__auto____8839) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____8839
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____8840 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8840) {
        return or__3548__auto____8840
      }else {
        var or__3548__auto____8841 = cljs.core._assoc["_"];
        if(or__3548__auto____8841) {
          return or__3548__auto____8841
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3546__auto____8842 = coll;
    if(and__3546__auto____8842) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____8842
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____8843 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8843) {
        return or__3548__auto____8843
      }else {
        var or__3548__auto____8844 = cljs.core._dissoc["_"];
        if(or__3548__auto____8844) {
          return or__3548__auto____8844
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3546__auto____8845 = coll;
    if(and__3546__auto____8845) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____8845
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8846 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8846) {
        return or__3548__auto____8846
      }else {
        var or__3548__auto____8847 = cljs.core._key["_"];
        if(or__3548__auto____8847) {
          return or__3548__auto____8847
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____8848 = coll;
    if(and__3546__auto____8848) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____8848
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8849 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8849) {
        return or__3548__auto____8849
      }else {
        var or__3548__auto____8850 = cljs.core._val["_"];
        if(or__3548__auto____8850) {
          return or__3548__auto____8850
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3546__auto____8851 = coll;
    if(and__3546__auto____8851) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____8851
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____8852 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8852) {
        return or__3548__auto____8852
      }else {
        var or__3548__auto____8853 = cljs.core._disjoin["_"];
        if(or__3548__auto____8853) {
          return or__3548__auto____8853
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3546__auto____8854 = coll;
    if(and__3546__auto____8854) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____8854
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8855 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8855) {
        return or__3548__auto____8855
      }else {
        var or__3548__auto____8856 = cljs.core._peek["_"];
        if(or__3548__auto____8856) {
          return or__3548__auto____8856
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____8857 = coll;
    if(and__3546__auto____8857) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____8857
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8858 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8858) {
        return or__3548__auto____8858
      }else {
        var or__3548__auto____8859 = cljs.core._pop["_"];
        if(or__3548__auto____8859) {
          return or__3548__auto____8859
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3546__auto____8860 = coll;
    if(and__3546__auto____8860) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____8860
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____8861 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8861) {
        return or__3548__auto____8861
      }else {
        var or__3548__auto____8862 = cljs.core._assoc_n["_"];
        if(or__3548__auto____8862) {
          return or__3548__auto____8862
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3546__auto____8863 = o;
    if(and__3546__auto____8863) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____8863
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____8864 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____8864) {
        return or__3548__auto____8864
      }else {
        var or__3548__auto____8865 = cljs.core._deref["_"];
        if(or__3548__auto____8865) {
          return or__3548__auto____8865
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3546__auto____8866 = o;
    if(and__3546__auto____8866) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____8866
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____8867 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____8867) {
        return or__3548__auto____8867
      }else {
        var or__3548__auto____8868 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____8868) {
          return or__3548__auto____8868
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3546__auto____8869 = o;
    if(and__3546__auto____8869) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____8869
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____8870 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____8870) {
        return or__3548__auto____8870
      }else {
        var or__3548__auto____8871 = cljs.core._meta["_"];
        if(or__3548__auto____8871) {
          return or__3548__auto____8871
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3546__auto____8872 = o;
    if(and__3546__auto____8872) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____8872
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____8873 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____8873) {
        return or__3548__auto____8873
      }else {
        var or__3548__auto____8874 = cljs.core._with_meta["_"];
        if(or__3548__auto____8874) {
          return or__3548__auto____8874
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3546__auto____8875 = coll;
      if(and__3546__auto____8875) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____8875
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____8876 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____8876) {
          return or__3548__auto____8876
        }else {
          var or__3548__auto____8877 = cljs.core._reduce["_"];
          if(or__3548__auto____8877) {
            return or__3548__auto____8877
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____8878 = coll;
      if(and__3546__auto____8878) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____8878
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____8879 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____8879) {
          return or__3548__auto____8879
        }else {
          var or__3548__auto____8880 = cljs.core._reduce["_"];
          if(or__3548__auto____8880) {
            return or__3548__auto____8880
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3546__auto____8881 = coll;
    if(and__3546__auto____8881) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____8881
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____8882 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8882) {
        return or__3548__auto____8882
      }else {
        var or__3548__auto____8883 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____8883) {
          return or__3548__auto____8883
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3546__auto____8884 = o;
    if(and__3546__auto____8884) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____8884
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____8885 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____8885) {
        return or__3548__auto____8885
      }else {
        var or__3548__auto____8886 = cljs.core._equiv["_"];
        if(or__3548__auto____8886) {
          return or__3548__auto____8886
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3546__auto____8887 = o;
    if(and__3546__auto____8887) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____8887
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____8888 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____8888) {
        return or__3548__auto____8888
      }else {
        var or__3548__auto____8889 = cljs.core._hash["_"];
        if(or__3548__auto____8889) {
          return or__3548__auto____8889
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3546__auto____8890 = o;
    if(and__3546__auto____8890) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____8890
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____8891 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____8891) {
        return or__3548__auto____8891
      }else {
        var or__3548__auto____8892 = cljs.core._seq["_"];
        if(or__3548__auto____8892) {
          return or__3548__auto____8892
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3546__auto____8893 = coll;
    if(and__3546__auto____8893) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____8893
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8894 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8894) {
        return or__3548__auto____8894
      }else {
        var or__3548__auto____8895 = cljs.core._rseq["_"];
        if(or__3548__auto____8895) {
          return or__3548__auto____8895
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____8896 = coll;
    if(and__3546__auto____8896) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____8896
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____8897 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8897) {
        return or__3548__auto____8897
      }else {
        var or__3548__auto____8898 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____8898) {
          return or__3548__auto____8898
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____8899 = coll;
    if(and__3546__auto____8899) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____8899
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____8900 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8900) {
        return or__3548__auto____8900
      }else {
        var or__3548__auto____8901 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____8901) {
          return or__3548__auto____8901
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____8902 = coll;
    if(and__3546__auto____8902) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____8902
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____8903 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8903) {
        return or__3548__auto____8903
      }else {
        var or__3548__auto____8904 = cljs.core._entry_key["_"];
        if(or__3548__auto____8904) {
          return or__3548__auto____8904
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____8905 = coll;
    if(and__3546__auto____8905) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____8905
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8906 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8906) {
        return or__3548__auto____8906
      }else {
        var or__3548__auto____8907 = cljs.core._comparator["_"];
        if(or__3548__auto____8907) {
          return or__3548__auto____8907
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3546__auto____8908 = o;
    if(and__3546__auto____8908) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____8908
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____8909 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____8909) {
        return or__3548__auto____8909
      }else {
        var or__3548__auto____8910 = cljs.core._pr_seq["_"];
        if(or__3548__auto____8910) {
          return or__3548__auto____8910
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3546__auto____8911 = d;
    if(and__3546__auto____8911) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____8911
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____8912 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____8912) {
        return or__3548__auto____8912
      }else {
        var or__3548__auto____8913 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____8913) {
          return or__3548__auto____8913
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3546__auto____8914 = this$;
    if(and__3546__auto____8914) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____8914
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____8915 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____8915) {
        return or__3548__auto____8915
      }else {
        var or__3548__auto____8916 = cljs.core._notify_watches["_"];
        if(or__3548__auto____8916) {
          return or__3548__auto____8916
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____8917 = this$;
    if(and__3546__auto____8917) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____8917
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____8918 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____8918) {
        return or__3548__auto____8918
      }else {
        var or__3548__auto____8919 = cljs.core._add_watch["_"];
        if(or__3548__auto____8919) {
          return or__3548__auto____8919
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____8920 = this$;
    if(and__3546__auto____8920) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____8920
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____8921 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____8921) {
        return or__3548__auto____8921
      }else {
        var or__3548__auto____8922 = cljs.core._remove_watch["_"];
        if(or__3548__auto____8922) {
          return or__3548__auto____8922
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3546__auto____8923 = coll;
    if(and__3546__auto____8923) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____8923
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____8924 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____8924) {
        return or__3548__auto____8924
      }else {
        var or__3548__auto____8925 = cljs.core._as_transient["_"];
        if(or__3548__auto____8925) {
          return or__3548__auto____8925
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3546__auto____8926 = tcoll;
    if(and__3546__auto____8926) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____8926
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____8927 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8927) {
        return or__3548__auto____8927
      }else {
        var or__3548__auto____8928 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____8928) {
          return or__3548__auto____8928
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____8929 = tcoll;
    if(and__3546__auto____8929) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____8929
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____8930 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8930) {
        return or__3548__auto____8930
      }else {
        var or__3548__auto____8931 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____8931) {
          return or__3548__auto____8931
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3546__auto____8932 = tcoll;
    if(and__3546__auto____8932) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____8932
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____8933 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8933) {
        return or__3548__auto____8933
      }else {
        var or__3548__auto____8934 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____8934) {
          return or__3548__auto____8934
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3546__auto____8935 = tcoll;
    if(and__3546__auto____8935) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____8935
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____8936 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8936) {
        return or__3548__auto____8936
      }else {
        var or__3548__auto____8937 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____8937) {
          return or__3548__auto____8937
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3546__auto____8938 = tcoll;
    if(and__3546__auto____8938) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____8938
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____8939 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8939) {
        return or__3548__auto____8939
      }else {
        var or__3548__auto____8940 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____8940) {
          return or__3548__auto____8940
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____8941 = tcoll;
    if(and__3546__auto____8941) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____8941
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____8942 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8942) {
        return or__3548__auto____8942
      }else {
        var or__3548__auto____8943 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____8943) {
          return or__3548__auto____8943
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3546__auto____8944 = tcoll;
    if(and__3546__auto____8944) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____8944
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____8945 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____8945) {
        return or__3548__auto____8945
      }else {
        var or__3548__auto____8946 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____8946) {
          return or__3548__auto____8946
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3548__auto____8947 = x === y;
    if(or__3548__auto____8947) {
      return or__3548__auto____8947
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__8948__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__8949 = y;
            var G__8950 = cljs.core.first.call(null, more);
            var G__8951 = cljs.core.next.call(null, more);
            x = G__8949;
            y = G__8950;
            more = G__8951;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__8948 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8948__delegate.call(this, x, y, more)
    };
    G__8948.cljs$lang$maxFixedArity = 2;
    G__8948.cljs$lang$applyTo = function(arglist__8952) {
      var x = cljs.core.first(arglist__8952);
      var y = cljs.core.first(cljs.core.next(arglist__8952));
      var more = cljs.core.rest(cljs.core.next(arglist__8952));
      return G__8948__delegate(x, y, more)
    };
    G__8948.cljs$lang$arity$variadic = G__8948__delegate;
    return G__8948
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3548__auto____8953 = x == null;
    if(or__3548__auto____8953) {
      return or__3548__auto____8953
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__8954 = null;
  var G__8954__2 = function(o, k) {
    return null
  };
  var G__8954__3 = function(o, k, not_found) {
    return not_found
  };
  G__8954 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8954__2.call(this, o, k);
      case 3:
        return G__8954__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8954
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__8955 = null;
  var G__8955__2 = function(_, f) {
    return f.call(null)
  };
  var G__8955__3 = function(_, f, start) {
    return start
  };
  G__8955 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8955__2.call(this, _, f);
      case 3:
        return G__8955__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8955
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__8956 = null;
  var G__8956__2 = function(_, n) {
    return null
  };
  var G__8956__3 = function(_, n, not_found) {
    return not_found
  };
  G__8956 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8956__2.call(this, _, n);
      case 3:
        return G__8956__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8956
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__8957 = cljs.core._nth.call(null, cicoll, 0);
      var n__8958 = 1;
      while(true) {
        if(n__8958 < cljs.core._count.call(null, cicoll)) {
          var nval__8959 = f.call(null, val__8957, cljs.core._nth.call(null, cicoll, n__8958));
          if(cljs.core.reduced_QMARK_.call(null, nval__8959)) {
            return cljs.core.deref.call(null, nval__8959)
          }else {
            var G__8966 = nval__8959;
            var G__8967 = n__8958 + 1;
            val__8957 = G__8966;
            n__8958 = G__8967;
            continue
          }
        }else {
          return val__8957
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__8960 = val;
    var n__8961 = 0;
    while(true) {
      if(n__8961 < cljs.core._count.call(null, cicoll)) {
        var nval__8962 = f.call(null, val__8960, cljs.core._nth.call(null, cicoll, n__8961));
        if(cljs.core.reduced_QMARK_.call(null, nval__8962)) {
          return cljs.core.deref.call(null, nval__8962)
        }else {
          var G__8968 = nval__8962;
          var G__8969 = n__8961 + 1;
          val__8960 = G__8968;
          n__8961 = G__8969;
          continue
        }
      }else {
        return val__8960
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__8963 = val;
    var n__8964 = idx;
    while(true) {
      if(n__8964 < cljs.core._count.call(null, cicoll)) {
        var nval__8965 = f.call(null, val__8963, cljs.core._nth.call(null, cicoll, n__8964));
        if(cljs.core.reduced_QMARK_.call(null, nval__8965)) {
          return cljs.core.deref.call(null, nval__8965)
        }else {
          var G__8970 = nval__8965;
          var G__8971 = n__8964 + 1;
          val__8963 = G__8970;
          n__8964 = G__8971;
          continue
        }
      }else {
        return val__8963
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8972 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8973 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__8974 = this;
  var this$__8975 = this;
  return cljs.core.pr_str.call(null, this$__8975)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8976 = this;
  if(cljs.core.counted_QMARK_.call(null, this__8976.a)) {
    return cljs.core.ci_reduce.call(null, this__8976.a, f, this__8976.a[this__8976.i], this__8976.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__8976.a[this__8976.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8977 = this;
  if(cljs.core.counted_QMARK_.call(null, this__8977.a)) {
    return cljs.core.ci_reduce.call(null, this__8977.a, f, start, this__8977.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8978 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__8979 = this;
  return this__8979.a.length - this__8979.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__8980 = this;
  return this__8980.a[this__8980.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__8981 = this;
  if(this__8981.i + 1 < this__8981.a.length) {
    return new cljs.core.IndexedSeq(this__8981.a, this__8981.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8982 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8983 = this;
  var i__8984 = n + this__8983.i;
  if(i__8984 < this__8983.a.length) {
    return this__8983.a[i__8984]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8985 = this;
  var i__8986 = n + this__8985.i;
  if(i__8986 < this__8985.a.length) {
    return this__8985.a[i__8986]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__8987 = null;
  var G__8987__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__8987__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__8987 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__8987__2.call(this, array, f);
      case 3:
        return G__8987__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8987
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__8988 = null;
  var G__8988__2 = function(array, k) {
    return array[k]
  };
  var G__8988__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__8988 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8988__2.call(this, array, k);
      case 3:
        return G__8988__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8988
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__8989 = null;
  var G__8989__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__8989__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__8989 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8989__2.call(this, array, n);
      case 3:
        return G__8989__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8989
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__8990__8991 = coll;
      if(G__8990__8991 != null) {
        if(function() {
          var or__3548__auto____8992 = G__8990__8991.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____8992) {
            return or__3548__auto____8992
          }else {
            return G__8990__8991.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__8990__8991.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__8990__8991)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__8990__8991)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__8993__8994 = coll;
      if(G__8993__8994 != null) {
        if(function() {
          var or__3548__auto____8995 = G__8993__8994.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____8995) {
            return or__3548__auto____8995
          }else {
            return G__8993__8994.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8993__8994.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8993__8994)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8993__8994)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__8996 = cljs.core.seq.call(null, coll);
      if(s__8996 != null) {
        return cljs.core._first.call(null, s__8996)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__8997__8998 = coll;
      if(G__8997__8998 != null) {
        if(function() {
          var or__3548__auto____8999 = G__8997__8998.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____8999) {
            return or__3548__auto____8999
          }else {
            return G__8997__8998.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__8997__8998.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8997__8998)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__8997__8998)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__9000 = cljs.core.seq.call(null, coll);
      if(s__9000 != null) {
        return cljs.core._rest.call(null, s__9000)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__9001__9002 = coll;
      if(G__9001__9002 != null) {
        if(function() {
          var or__3548__auto____9003 = G__9001__9002.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____9003) {
            return or__3548__auto____9003
          }else {
            return G__9001__9002.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9001__9002.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9001__9002)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9001__9002)
      }
    }()) {
      var coll__9004 = cljs.core._rest.call(null, coll);
      if(coll__9004 != null) {
        if(function() {
          var G__9005__9006 = coll__9004;
          if(G__9005__9006 != null) {
            if(function() {
              var or__3548__auto____9007 = G__9005__9006.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____9007) {
                return or__3548__auto____9007
              }else {
                return G__9005__9006.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__9005__9006.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9005__9006)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__9005__9006)
          }
        }()) {
          return coll__9004
        }else {
          return cljs.core._seq.call(null, coll__9004)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__9008 = cljs.core.next.call(null, s);
      s = G__9008;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__9009__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__9010 = conj.call(null, coll, x);
          var G__9011 = cljs.core.first.call(null, xs);
          var G__9012 = cljs.core.next.call(null, xs);
          coll = G__9010;
          x = G__9011;
          xs = G__9012;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__9009 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9009__delegate.call(this, coll, x, xs)
    };
    G__9009.cljs$lang$maxFixedArity = 2;
    G__9009.cljs$lang$applyTo = function(arglist__9013) {
      var coll = cljs.core.first(arglist__9013);
      var x = cljs.core.first(cljs.core.next(arglist__9013));
      var xs = cljs.core.rest(cljs.core.next(arglist__9013));
      return G__9009__delegate(coll, x, xs)
    };
    G__9009.cljs$lang$arity$variadic = G__9009__delegate;
    return G__9009
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__9014 = cljs.core.seq.call(null, coll);
  var acc__9015 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__9014)) {
      return acc__9015 + cljs.core._count.call(null, s__9014)
    }else {
      var G__9016 = cljs.core.next.call(null, s__9014);
      var G__9017 = acc__9015 + 1;
      s__9014 = G__9016;
      acc__9015 = G__9017;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__9018__9019 = coll;
        if(G__9018__9019 != null) {
          if(function() {
            var or__3548__auto____9020 = G__9018__9019.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____9020) {
              return or__3548__auto____9020
            }else {
              return G__9018__9019.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__9018__9019.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9018__9019)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9018__9019)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__9021__9022 = coll;
        if(G__9021__9022 != null) {
          if(function() {
            var or__3548__auto____9023 = G__9021__9022.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____9023) {
              return or__3548__auto____9023
            }else {
              return G__9021__9022.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__9021__9022.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9021__9022)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9021__9022)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__9025__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__9024 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__9026 = ret__9024;
          var G__9027 = cljs.core.first.call(null, kvs);
          var G__9028 = cljs.core.second.call(null, kvs);
          var G__9029 = cljs.core.nnext.call(null, kvs);
          coll = G__9026;
          k = G__9027;
          v = G__9028;
          kvs = G__9029;
          continue
        }else {
          return ret__9024
        }
        break
      }
    };
    var G__9025 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9025__delegate.call(this, coll, k, v, kvs)
    };
    G__9025.cljs$lang$maxFixedArity = 3;
    G__9025.cljs$lang$applyTo = function(arglist__9030) {
      var coll = cljs.core.first(arglist__9030);
      var k = cljs.core.first(cljs.core.next(arglist__9030));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9030)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9030)));
      return G__9025__delegate(coll, k, v, kvs)
    };
    G__9025.cljs$lang$arity$variadic = G__9025__delegate;
    return G__9025
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__9032__delegate = function(coll, k, ks) {
      while(true) {
        var ret__9031 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__9033 = ret__9031;
          var G__9034 = cljs.core.first.call(null, ks);
          var G__9035 = cljs.core.next.call(null, ks);
          coll = G__9033;
          k = G__9034;
          ks = G__9035;
          continue
        }else {
          return ret__9031
        }
        break
      }
    };
    var G__9032 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9032__delegate.call(this, coll, k, ks)
    };
    G__9032.cljs$lang$maxFixedArity = 2;
    G__9032.cljs$lang$applyTo = function(arglist__9036) {
      var coll = cljs.core.first(arglist__9036);
      var k = cljs.core.first(cljs.core.next(arglist__9036));
      var ks = cljs.core.rest(cljs.core.next(arglist__9036));
      return G__9032__delegate(coll, k, ks)
    };
    G__9032.cljs$lang$arity$variadic = G__9032__delegate;
    return G__9032
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__9037__9038 = o;
    if(G__9037__9038 != null) {
      if(function() {
        var or__3548__auto____9039 = G__9037__9038.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____9039) {
          return or__3548__auto____9039
        }else {
          return G__9037__9038.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__9037__9038.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9037__9038)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9037__9038)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__9041__delegate = function(coll, k, ks) {
      while(true) {
        var ret__9040 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__9042 = ret__9040;
          var G__9043 = cljs.core.first.call(null, ks);
          var G__9044 = cljs.core.next.call(null, ks);
          coll = G__9042;
          k = G__9043;
          ks = G__9044;
          continue
        }else {
          return ret__9040
        }
        break
      }
    };
    var G__9041 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9041__delegate.call(this, coll, k, ks)
    };
    G__9041.cljs$lang$maxFixedArity = 2;
    G__9041.cljs$lang$applyTo = function(arglist__9045) {
      var coll = cljs.core.first(arglist__9045);
      var k = cljs.core.first(cljs.core.next(arglist__9045));
      var ks = cljs.core.rest(cljs.core.next(arglist__9045));
      return G__9041__delegate(coll, k, ks)
    };
    G__9041.cljs$lang$arity$variadic = G__9041__delegate;
    return G__9041
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9046__9047 = x;
    if(G__9046__9047 != null) {
      if(function() {
        var or__3548__auto____9048 = G__9046__9047.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____9048) {
          return or__3548__auto____9048
        }else {
          return G__9046__9047.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__9046__9047.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__9046__9047)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__9046__9047)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9049__9050 = x;
    if(G__9049__9050 != null) {
      if(function() {
        var or__3548__auto____9051 = G__9049__9050.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____9051) {
          return or__3548__auto____9051
        }else {
          return G__9049__9050.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__9049__9050.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__9049__9050)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__9049__9050)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__9052__9053 = x;
  if(G__9052__9053 != null) {
    if(function() {
      var or__3548__auto____9054 = G__9052__9053.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____9054) {
        return or__3548__auto____9054
      }else {
        return G__9052__9053.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__9052__9053.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__9052__9053)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__9052__9053)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__9055__9056 = x;
  if(G__9055__9056 != null) {
    if(function() {
      var or__3548__auto____9057 = G__9055__9056.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____9057) {
        return or__3548__auto____9057
      }else {
        return G__9055__9056.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__9055__9056.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__9055__9056)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__9055__9056)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__9058__9059 = x;
  if(G__9058__9059 != null) {
    if(function() {
      var or__3548__auto____9060 = G__9058__9059.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____9060) {
        return or__3548__auto____9060
      }else {
        return G__9058__9059.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__9058__9059.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__9058__9059)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__9058__9059)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__9061__9062 = x;
  if(G__9061__9062 != null) {
    if(function() {
      var or__3548__auto____9063 = G__9061__9062.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____9063) {
        return or__3548__auto____9063
      }else {
        return G__9061__9062.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__9061__9062.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9061__9062)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__9061__9062)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__9064__9065 = x;
  if(G__9064__9065 != null) {
    if(function() {
      var or__3548__auto____9066 = G__9064__9065.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____9066) {
        return or__3548__auto____9066
      }else {
        return G__9064__9065.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__9064__9065.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9064__9065)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9064__9065)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__9067__9068 = x;
    if(G__9067__9068 != null) {
      if(function() {
        var or__3548__auto____9069 = G__9067__9068.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____9069) {
          return or__3548__auto____9069
        }else {
          return G__9067__9068.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__9067__9068.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__9067__9068)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__9067__9068)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__9070__9071 = x;
  if(G__9070__9071 != null) {
    if(function() {
      var or__3548__auto____9072 = G__9070__9071.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____9072) {
        return or__3548__auto____9072
      }else {
        return G__9070__9071.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__9070__9071.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__9070__9071)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__9070__9071)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__9073__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__9073 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9073__delegate.call(this, keyvals)
    };
    G__9073.cljs$lang$maxFixedArity = 0;
    G__9073.cljs$lang$applyTo = function(arglist__9074) {
      var keyvals = cljs.core.seq(arglist__9074);
      return G__9073__delegate(keyvals)
    };
    G__9073.cljs$lang$arity$variadic = G__9073__delegate;
    return G__9073
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__9075 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__9075.push(key)
  });
  return keys__9075
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__9076 = i;
  var j__9077 = j;
  var len__9078 = len;
  while(true) {
    if(len__9078 === 0) {
      return to
    }else {
      to[j__9077] = from[i__9076];
      var G__9079 = i__9076 + 1;
      var G__9080 = j__9077 + 1;
      var G__9081 = len__9078 - 1;
      i__9076 = G__9079;
      j__9077 = G__9080;
      len__9078 = G__9081;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__9082 = i + (len - 1);
  var j__9083 = j + (len - 1);
  var len__9084 = len;
  while(true) {
    if(len__9084 === 0) {
      return to
    }else {
      to[j__9083] = from[i__9082];
      var G__9085 = i__9082 - 1;
      var G__9086 = j__9083 - 1;
      var G__9087 = len__9084 - 1;
      i__9082 = G__9085;
      j__9083 = G__9086;
      len__9084 = G__9087;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__9088__9089 = s;
    if(G__9088__9089 != null) {
      if(function() {
        var or__3548__auto____9090 = G__9088__9089.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____9090) {
          return or__3548__auto____9090
        }else {
          return G__9088__9089.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__9088__9089.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9088__9089)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9088__9089)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__9091__9092 = s;
  if(G__9091__9092 != null) {
    if(function() {
      var or__3548__auto____9093 = G__9091__9092.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____9093) {
        return or__3548__auto____9093
      }else {
        return G__9091__9092.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__9091__9092.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__9091__9092)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__9091__9092)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____9094 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____9094)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____9095 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____9095) {
        return or__3548__auto____9095
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____9094
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____9096 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____9096)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____9096
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____9097 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____9097)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____9097
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____9098 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____9098) {
    return or__3548__auto____9098
  }else {
    var G__9099__9100 = f;
    if(G__9099__9100 != null) {
      if(function() {
        var or__3548__auto____9101 = G__9099__9100.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____9101) {
          return or__3548__auto____9101
        }else {
          return G__9099__9100.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__9099__9100.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9099__9100)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__9099__9100)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____9102 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____9102) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____9102
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9103 = coll;
    if(cljs.core.truth_(and__3546__auto____9103)) {
      var and__3546__auto____9104 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____9104) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____9104
      }
    }else {
      return and__3546__auto____9103
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__9109__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__9105 = cljs.core.set([y, x]);
        var xs__9106 = more;
        while(true) {
          var x__9107 = cljs.core.first.call(null, xs__9106);
          var etc__9108 = cljs.core.next.call(null, xs__9106);
          if(cljs.core.truth_(xs__9106)) {
            if(cljs.core.contains_QMARK_.call(null, s__9105, x__9107)) {
              return false
            }else {
              var G__9110 = cljs.core.conj.call(null, s__9105, x__9107);
              var G__9111 = etc__9108;
              s__9105 = G__9110;
              xs__9106 = G__9111;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__9109 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9109__delegate.call(this, x, y, more)
    };
    G__9109.cljs$lang$maxFixedArity = 2;
    G__9109.cljs$lang$applyTo = function(arglist__9112) {
      var x = cljs.core.first(arglist__9112);
      var y = cljs.core.first(cljs.core.next(arglist__9112));
      var more = cljs.core.rest(cljs.core.next(arglist__9112));
      return G__9109__delegate(x, y, more)
    };
    G__9109.cljs$lang$arity$variadic = G__9109__delegate;
    return G__9109
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__9113 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__9113)) {
        return r__9113
      }else {
        if(cljs.core.truth_(r__9113)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__9114 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__9114, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__9114)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3695__auto____9115 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____9115)) {
      var s__9116 = temp__3695__auto____9115;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__9116), cljs.core.next.call(null, s__9116))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__9117 = val;
    var coll__9118 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__9118)) {
        var nval__9119 = f.call(null, val__9117, cljs.core.first.call(null, coll__9118));
        if(cljs.core.reduced_QMARK_.call(null, nval__9119)) {
          return cljs.core.deref.call(null, nval__9119)
        }else {
          var G__9120 = nval__9119;
          var G__9121 = cljs.core.next.call(null, coll__9118);
          val__9117 = G__9120;
          coll__9118 = G__9121;
          continue
        }
      }else {
        return val__9117
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__9122__9123 = coll;
      if(G__9122__9123 != null) {
        if(function() {
          var or__3548__auto____9124 = G__9122__9123.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____9124) {
            return or__3548__auto____9124
          }else {
            return G__9122__9123.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9122__9123.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9122__9123)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9122__9123)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__9125__9126 = coll;
      if(G__9125__9126 != null) {
        if(function() {
          var or__3548__auto____9127 = G__9125__9126.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____9127) {
            return or__3548__auto____9127
          }else {
            return G__9125__9126.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__9125__9126.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9125__9126)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__9125__9126)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__9128 = this;
  return this__9128.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__9129__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__9129 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9129__delegate.call(this, x, y, more)
    };
    G__9129.cljs$lang$maxFixedArity = 2;
    G__9129.cljs$lang$applyTo = function(arglist__9130) {
      var x = cljs.core.first(arglist__9130);
      var y = cljs.core.first(cljs.core.next(arglist__9130));
      var more = cljs.core.rest(cljs.core.next(arglist__9130));
      return G__9129__delegate(x, y, more)
    };
    G__9129.cljs$lang$arity$variadic = G__9129__delegate;
    return G__9129
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__9131__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__9131 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9131__delegate.call(this, x, y, more)
    };
    G__9131.cljs$lang$maxFixedArity = 2;
    G__9131.cljs$lang$applyTo = function(arglist__9132) {
      var x = cljs.core.first(arglist__9132);
      var y = cljs.core.first(cljs.core.next(arglist__9132));
      var more = cljs.core.rest(cljs.core.next(arglist__9132));
      return G__9131__delegate(x, y, more)
    };
    G__9131.cljs$lang$arity$variadic = G__9131__delegate;
    return G__9131
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__9133__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__9133 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9133__delegate.call(this, x, y, more)
    };
    G__9133.cljs$lang$maxFixedArity = 2;
    G__9133.cljs$lang$applyTo = function(arglist__9134) {
      var x = cljs.core.first(arglist__9134);
      var y = cljs.core.first(cljs.core.next(arglist__9134));
      var more = cljs.core.rest(cljs.core.next(arglist__9134));
      return G__9133__delegate(x, y, more)
    };
    G__9133.cljs$lang$arity$variadic = G__9133__delegate;
    return G__9133
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__9135__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__9135 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9135__delegate.call(this, x, y, more)
    };
    G__9135.cljs$lang$maxFixedArity = 2;
    G__9135.cljs$lang$applyTo = function(arglist__9136) {
      var x = cljs.core.first(arglist__9136);
      var y = cljs.core.first(cljs.core.next(arglist__9136));
      var more = cljs.core.rest(cljs.core.next(arglist__9136));
      return G__9135__delegate(x, y, more)
    };
    G__9135.cljs$lang$arity$variadic = G__9135__delegate;
    return G__9135
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__9137__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9138 = y;
            var G__9139 = cljs.core.first.call(null, more);
            var G__9140 = cljs.core.next.call(null, more);
            x = G__9138;
            y = G__9139;
            more = G__9140;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9137 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9137__delegate.call(this, x, y, more)
    };
    G__9137.cljs$lang$maxFixedArity = 2;
    G__9137.cljs$lang$applyTo = function(arglist__9141) {
      var x = cljs.core.first(arglist__9141);
      var y = cljs.core.first(cljs.core.next(arglist__9141));
      var more = cljs.core.rest(cljs.core.next(arglist__9141));
      return G__9137__delegate(x, y, more)
    };
    G__9137.cljs$lang$arity$variadic = G__9137__delegate;
    return G__9137
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__9142__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9143 = y;
            var G__9144 = cljs.core.first.call(null, more);
            var G__9145 = cljs.core.next.call(null, more);
            x = G__9143;
            y = G__9144;
            more = G__9145;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9142 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9142__delegate.call(this, x, y, more)
    };
    G__9142.cljs$lang$maxFixedArity = 2;
    G__9142.cljs$lang$applyTo = function(arglist__9146) {
      var x = cljs.core.first(arglist__9146);
      var y = cljs.core.first(cljs.core.next(arglist__9146));
      var more = cljs.core.rest(cljs.core.next(arglist__9146));
      return G__9142__delegate(x, y, more)
    };
    G__9142.cljs$lang$arity$variadic = G__9142__delegate;
    return G__9142
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__9147__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9148 = y;
            var G__9149 = cljs.core.first.call(null, more);
            var G__9150 = cljs.core.next.call(null, more);
            x = G__9148;
            y = G__9149;
            more = G__9150;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9147 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9147__delegate.call(this, x, y, more)
    };
    G__9147.cljs$lang$maxFixedArity = 2;
    G__9147.cljs$lang$applyTo = function(arglist__9151) {
      var x = cljs.core.first(arglist__9151);
      var y = cljs.core.first(cljs.core.next(arglist__9151));
      var more = cljs.core.rest(cljs.core.next(arglist__9151));
      return G__9147__delegate(x, y, more)
    };
    G__9147.cljs$lang$arity$variadic = G__9147__delegate;
    return G__9147
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__9152__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9153 = y;
            var G__9154 = cljs.core.first.call(null, more);
            var G__9155 = cljs.core.next.call(null, more);
            x = G__9153;
            y = G__9154;
            more = G__9155;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9152 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9152__delegate.call(this, x, y, more)
    };
    G__9152.cljs$lang$maxFixedArity = 2;
    G__9152.cljs$lang$applyTo = function(arglist__9156) {
      var x = cljs.core.first(arglist__9156);
      var y = cljs.core.first(cljs.core.next(arglist__9156));
      var more = cljs.core.rest(cljs.core.next(arglist__9156));
      return G__9152__delegate(x, y, more)
    };
    G__9152.cljs$lang$arity$variadic = G__9152__delegate;
    return G__9152
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__9157__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__9157 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9157__delegate.call(this, x, y, more)
    };
    G__9157.cljs$lang$maxFixedArity = 2;
    G__9157.cljs$lang$applyTo = function(arglist__9158) {
      var x = cljs.core.first(arglist__9158);
      var y = cljs.core.first(cljs.core.next(arglist__9158));
      var more = cljs.core.rest(cljs.core.next(arglist__9158));
      return G__9157__delegate(x, y, more)
    };
    G__9157.cljs$lang$arity$variadic = G__9157__delegate;
    return G__9157
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__9159__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__9159 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9159__delegate.call(this, x, y, more)
    };
    G__9159.cljs$lang$maxFixedArity = 2;
    G__9159.cljs$lang$applyTo = function(arglist__9160) {
      var x = cljs.core.first(arglist__9160);
      var y = cljs.core.first(cljs.core.next(arglist__9160));
      var more = cljs.core.rest(cljs.core.next(arglist__9160));
      return G__9159__delegate(x, y, more)
    };
    G__9159.cljs$lang$arity$variadic = G__9159__delegate;
    return G__9159
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__9161 = n % d;
  return cljs.core.fix.call(null, (n - rem__9161) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__9162 = cljs.core.quot.call(null, n, d);
  return n - d * q__9162
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__9163 = 0;
  var n__9164 = n;
  while(true) {
    if(n__9164 === 0) {
      return c__9163
    }else {
      var G__9165 = c__9163 + 1;
      var G__9166 = n__9164 & n__9164 - 1;
      c__9163 = G__9165;
      n__9164 = G__9166;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__9167__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__9168 = y;
            var G__9169 = cljs.core.first.call(null, more);
            var G__9170 = cljs.core.next.call(null, more);
            x = G__9168;
            y = G__9169;
            more = G__9170;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__9167 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9167__delegate.call(this, x, y, more)
    };
    G__9167.cljs$lang$maxFixedArity = 2;
    G__9167.cljs$lang$applyTo = function(arglist__9171) {
      var x = cljs.core.first(arglist__9171);
      var y = cljs.core.first(cljs.core.next(arglist__9171));
      var more = cljs.core.rest(cljs.core.next(arglist__9171));
      return G__9167__delegate(x, y, more)
    };
    G__9167.cljs$lang$arity$variadic = G__9167__delegate;
    return G__9167
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__9172 = n;
  var xs__9173 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9174 = xs__9173;
      if(cljs.core.truth_(and__3546__auto____9174)) {
        return n__9172 > 0
      }else {
        return and__3546__auto____9174
      }
    }())) {
      var G__9175 = n__9172 - 1;
      var G__9176 = cljs.core.next.call(null, xs__9173);
      n__9172 = G__9175;
      xs__9173 = G__9176;
      continue
    }else {
      return xs__9173
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__9177__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9178 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__9179 = cljs.core.next.call(null, more);
            sb = G__9178;
            more = G__9179;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__9177 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9177__delegate.call(this, x, ys)
    };
    G__9177.cljs$lang$maxFixedArity = 1;
    G__9177.cljs$lang$applyTo = function(arglist__9180) {
      var x = cljs.core.first(arglist__9180);
      var ys = cljs.core.rest(arglist__9180);
      return G__9177__delegate(x, ys)
    };
    G__9177.cljs$lang$arity$variadic = G__9177__delegate;
    return G__9177
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__9181__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__9182 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__9183 = cljs.core.next.call(null, more);
            sb = G__9182;
            more = G__9183;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__9181 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9181__delegate.call(this, x, ys)
    };
    G__9181.cljs$lang$maxFixedArity = 1;
    G__9181.cljs$lang$applyTo = function(arglist__9184) {
      var x = cljs.core.first(arglist__9184);
      var ys = cljs.core.rest(arglist__9184);
      return G__9181__delegate(x, ys)
    };
    G__9181.cljs$lang$arity$variadic = G__9181__delegate;
    return G__9181
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__9185 = cljs.core.seq.call(null, x);
    var ys__9186 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__9185 == null) {
        return ys__9186 == null
      }else {
        if(ys__9186 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__9185), cljs.core.first.call(null, ys__9186))) {
            var G__9187 = cljs.core.next.call(null, xs__9185);
            var G__9188 = cljs.core.next.call(null, ys__9186);
            xs__9185 = G__9187;
            ys__9186 = G__9188;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__9189_SHARP_, p2__9190_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__9189_SHARP_, cljs.core.hash.call(null, p2__9190_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__9191 = 0;
  var s__9192 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__9192)) {
      var e__9193 = cljs.core.first.call(null, s__9192);
      var G__9194 = (h__9191 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__9193)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__9193)))) % 4503599627370496;
      var G__9195 = cljs.core.next.call(null, s__9192);
      h__9191 = G__9194;
      s__9192 = G__9195;
      continue
    }else {
      return h__9191
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__9196 = 0;
  var s__9197 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__9197)) {
      var e__9198 = cljs.core.first.call(null, s__9197);
      var G__9199 = (h__9196 + cljs.core.hash.call(null, e__9198)) % 4503599627370496;
      var G__9200 = cljs.core.next.call(null, s__9197);
      h__9196 = G__9199;
      s__9197 = G__9200;
      continue
    }else {
      return h__9196
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__9201__9202 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__9201__9202)) {
    var G__9204__9206 = cljs.core.first.call(null, G__9201__9202);
    var vec__9205__9207 = G__9204__9206;
    var key_name__9208 = cljs.core.nth.call(null, vec__9205__9207, 0, null);
    var f__9209 = cljs.core.nth.call(null, vec__9205__9207, 1, null);
    var G__9201__9210 = G__9201__9202;
    var G__9204__9211 = G__9204__9206;
    var G__9201__9212 = G__9201__9210;
    while(true) {
      var vec__9213__9214 = G__9204__9211;
      var key_name__9215 = cljs.core.nth.call(null, vec__9213__9214, 0, null);
      var f__9216 = cljs.core.nth.call(null, vec__9213__9214, 1, null);
      var G__9201__9217 = G__9201__9212;
      var str_name__9218 = cljs.core.name.call(null, key_name__9215);
      obj[str_name__9218] = f__9216;
      var temp__3698__auto____9219 = cljs.core.next.call(null, G__9201__9217);
      if(cljs.core.truth_(temp__3698__auto____9219)) {
        var G__9201__9220 = temp__3698__auto____9219;
        var G__9221 = cljs.core.first.call(null, G__9201__9220);
        var G__9222 = G__9201__9220;
        G__9204__9211 = G__9221;
        G__9201__9212 = G__9222;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9223 = this;
  var h__364__auto____9224 = this__9223.__hash;
  if(h__364__auto____9224 != null) {
    return h__364__auto____9224
  }else {
    var h__364__auto____9225 = cljs.core.hash_coll.call(null, coll);
    this__9223.__hash = h__364__auto____9225;
    return h__364__auto____9225
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9226 = this;
  return new cljs.core.List(this__9226.meta, o, coll, this__9226.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__9227 = this;
  var this$__9228 = this;
  return cljs.core.pr_str.call(null, this$__9228)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9229 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9230 = this;
  return this__9230.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9231 = this;
  return this__9231.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9232 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9233 = this;
  return this__9233.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9234 = this;
  return this__9234.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9235 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9236 = this;
  return new cljs.core.List(meta, this__9236.first, this__9236.rest, this__9236.count, this__9236.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9237 = this;
  return this__9237.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9238 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9239 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9240 = this;
  return new cljs.core.List(this__9240.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__9241 = this;
  var this$__9242 = this;
  return cljs.core.pr_str.call(null, this$__9242)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9243 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9244 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9245 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9246 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9247 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9248 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9249 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9250 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9251 = this;
  return this__9251.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9252 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__9253__9254 = coll;
  if(G__9253__9254 != null) {
    if(function() {
      var or__3548__auto____9255 = G__9253__9254.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____9255) {
        return or__3548__auto____9255
      }else {
        return G__9253__9254.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__9253__9254.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9253__9254)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__9253__9254)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__9256) {
    var items = cljs.core.seq(arglist__9256);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9257 = this;
  var h__364__auto____9258 = this__9257.__hash;
  if(h__364__auto____9258 != null) {
    return h__364__auto____9258
  }else {
    var h__364__auto____9259 = cljs.core.hash_coll.call(null, coll);
    this__9257.__hash = h__364__auto____9259;
    return h__364__auto____9259
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9260 = this;
  return new cljs.core.Cons(null, o, coll, this__9260.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__9261 = this;
  var this$__9262 = this;
  return cljs.core.pr_str.call(null, this$__9262)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9263 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9264 = this;
  return this__9264.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9265 = this;
  if(this__9265.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__9265.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9266 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9267 = this;
  return new cljs.core.Cons(meta, this__9267.first, this__9267.rest, this__9267.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9268 = this;
  return this__9268.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9269 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9269.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____9270 = coll == null;
    if(or__3548__auto____9270) {
      return or__3548__auto____9270
    }else {
      var G__9271__9272 = coll;
      if(G__9271__9272 != null) {
        if(function() {
          var or__3548__auto____9273 = G__9271__9272.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____9273) {
            return or__3548__auto____9273
          }else {
            return G__9271__9272.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__9271__9272.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9271__9272)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__9271__9272)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__9274__9275 = x;
  if(G__9274__9275 != null) {
    if(function() {
      var or__3548__auto____9276 = G__9274__9275.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____9276) {
        return or__3548__auto____9276
      }else {
        return G__9274__9275.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__9274__9275.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9274__9275)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__9274__9275)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__9277 = null;
  var G__9277__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__9277__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__9277 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__9277__2.call(this, string, f);
      case 3:
        return G__9277__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9277
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__9278 = null;
  var G__9278__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__9278__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__9278 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9278__2.call(this, string, k);
      case 3:
        return G__9278__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9278
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__9279 = null;
  var G__9279__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__9279__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__9279 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9279__2.call(this, string, n);
      case 3:
        return G__9279__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9279
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__9288 = null;
  var G__9288__2 = function(tsym9282, coll) {
    var tsym9282__9284 = this;
    var this$__9285 = tsym9282__9284;
    return cljs.core.get.call(null, coll, this$__9285.toString())
  };
  var G__9288__3 = function(tsym9283, coll, not_found) {
    var tsym9283__9286 = this;
    var this$__9287 = tsym9283__9286;
    return cljs.core.get.call(null, coll, this$__9287.toString(), not_found)
  };
  G__9288 = function(tsym9283, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9288__2.call(this, tsym9283, coll);
      case 3:
        return G__9288__3.call(this, tsym9283, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9288
}();
String.prototype.apply = function(tsym9280, args9281) {
  return tsym9280.call.apply(tsym9280, [tsym9280].concat(cljs.core.aclone.call(null, args9281)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__9289 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__9289
  }else {
    lazy_seq.x = x__9289.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9290 = this;
  var h__364__auto____9291 = this__9290.__hash;
  if(h__364__auto____9291 != null) {
    return h__364__auto____9291
  }else {
    var h__364__auto____9292 = cljs.core.hash_coll.call(null, coll);
    this__9290.__hash = h__364__auto____9292;
    return h__364__auto____9292
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9293 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__9294 = this;
  var this$__9295 = this;
  return cljs.core.pr_str.call(null, this$__9295)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9296 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9297 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9298 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9299 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9300 = this;
  return new cljs.core.LazySeq(meta, this__9300.realized, this__9300.x, this__9300.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9301 = this;
  return this__9301.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9302 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9302.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__9303 = [];
  var s__9304 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__9304))) {
      ary__9303.push(cljs.core.first.call(null, s__9304));
      var G__9305 = cljs.core.next.call(null, s__9304);
      s__9304 = G__9305;
      continue
    }else {
      return ary__9303
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__9306 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__9307 = 0;
  var xs__9308 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__9308)) {
      ret__9306[i__9307] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__9308));
      var G__9309 = i__9307 + 1;
      var G__9310 = cljs.core.next.call(null, xs__9308);
      i__9307 = G__9309;
      xs__9308 = G__9310;
      continue
    }else {
    }
    break
  }
  return ret__9306
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__9311 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9312 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9313 = 0;
      var s__9314 = s__9312;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____9315 = s__9314;
          if(cljs.core.truth_(and__3546__auto____9315)) {
            return i__9313 < size
          }else {
            return and__3546__auto____9315
          }
        }())) {
          a__9311[i__9313] = cljs.core.first.call(null, s__9314);
          var G__9318 = i__9313 + 1;
          var G__9319 = cljs.core.next.call(null, s__9314);
          i__9313 = G__9318;
          s__9314 = G__9319;
          continue
        }else {
          return a__9311
        }
        break
      }
    }else {
      var n__685__auto____9316 = size;
      var i__9317 = 0;
      while(true) {
        if(i__9317 < n__685__auto____9316) {
          a__9311[i__9317] = init_val_or_seq;
          var G__9320 = i__9317 + 1;
          i__9317 = G__9320;
          continue
        }else {
        }
        break
      }
      return a__9311
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__9321 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9322 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9323 = 0;
      var s__9324 = s__9322;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____9325 = s__9324;
          if(cljs.core.truth_(and__3546__auto____9325)) {
            return i__9323 < size
          }else {
            return and__3546__auto____9325
          }
        }())) {
          a__9321[i__9323] = cljs.core.first.call(null, s__9324);
          var G__9328 = i__9323 + 1;
          var G__9329 = cljs.core.next.call(null, s__9324);
          i__9323 = G__9328;
          s__9324 = G__9329;
          continue
        }else {
          return a__9321
        }
        break
      }
    }else {
      var n__685__auto____9326 = size;
      var i__9327 = 0;
      while(true) {
        if(i__9327 < n__685__auto____9326) {
          a__9321[i__9327] = init_val_or_seq;
          var G__9330 = i__9327 + 1;
          i__9327 = G__9330;
          continue
        }else {
        }
        break
      }
      return a__9321
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__9331 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__9332 = cljs.core.seq.call(null, init_val_or_seq);
      var i__9333 = 0;
      var s__9334 = s__9332;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____9335 = s__9334;
          if(cljs.core.truth_(and__3546__auto____9335)) {
            return i__9333 < size
          }else {
            return and__3546__auto____9335
          }
        }())) {
          a__9331[i__9333] = cljs.core.first.call(null, s__9334);
          var G__9338 = i__9333 + 1;
          var G__9339 = cljs.core.next.call(null, s__9334);
          i__9333 = G__9338;
          s__9334 = G__9339;
          continue
        }else {
          return a__9331
        }
        break
      }
    }else {
      var n__685__auto____9336 = size;
      var i__9337 = 0;
      while(true) {
        if(i__9337 < n__685__auto____9336) {
          a__9331[i__9337] = init_val_or_seq;
          var G__9340 = i__9337 + 1;
          i__9337 = G__9340;
          continue
        }else {
        }
        break
      }
      return a__9331
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__9341 = s;
    var i__9342 = n;
    var sum__9343 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____9344 = i__9342 > 0;
        if(and__3546__auto____9344) {
          return cljs.core.seq.call(null, s__9341)
        }else {
          return and__3546__auto____9344
        }
      }())) {
        var G__9345 = cljs.core.next.call(null, s__9341);
        var G__9346 = i__9342 - 1;
        var G__9347 = sum__9343 + 1;
        s__9341 = G__9345;
        i__9342 = G__9346;
        sum__9343 = G__9347;
        continue
      }else {
        return sum__9343
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__9348 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__9348)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9348), concat.call(null, cljs.core.rest.call(null, s__9348), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__9351__delegate = function(x, y, zs) {
      var cat__9350 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__9349 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__9349)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__9349), cat.call(null, cljs.core.rest.call(null, xys__9349), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__9350.call(null, concat.call(null, x, y), zs)
    };
    var G__9351 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9351__delegate.call(this, x, y, zs)
    };
    G__9351.cljs$lang$maxFixedArity = 2;
    G__9351.cljs$lang$applyTo = function(arglist__9352) {
      var x = cljs.core.first(arglist__9352);
      var y = cljs.core.first(cljs.core.next(arglist__9352));
      var zs = cljs.core.rest(cljs.core.next(arglist__9352));
      return G__9351__delegate(x, y, zs)
    };
    G__9351.cljs$lang$arity$variadic = G__9351__delegate;
    return G__9351
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__9353__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__9353 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9353__delegate.call(this, a, b, c, d, more)
    };
    G__9353.cljs$lang$maxFixedArity = 4;
    G__9353.cljs$lang$applyTo = function(arglist__9354) {
      var a = cljs.core.first(arglist__9354);
      var b = cljs.core.first(cljs.core.next(arglist__9354));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9354)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9354))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9354))));
      return G__9353__delegate(a, b, c, d, more)
    };
    G__9353.cljs$lang$arity$variadic = G__9353__delegate;
    return G__9353
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__9355 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__9356 = cljs.core._first.call(null, args__9355);
    var args__9357 = cljs.core._rest.call(null, args__9355);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__9356)
      }else {
        return f.call(null, a__9356)
      }
    }else {
      var b__9358 = cljs.core._first.call(null, args__9357);
      var args__9359 = cljs.core._rest.call(null, args__9357);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__9356, b__9358)
        }else {
          return f.call(null, a__9356, b__9358)
        }
      }else {
        var c__9360 = cljs.core._first.call(null, args__9359);
        var args__9361 = cljs.core._rest.call(null, args__9359);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__9356, b__9358, c__9360)
          }else {
            return f.call(null, a__9356, b__9358, c__9360)
          }
        }else {
          var d__9362 = cljs.core._first.call(null, args__9361);
          var args__9363 = cljs.core._rest.call(null, args__9361);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__9356, b__9358, c__9360, d__9362)
            }else {
              return f.call(null, a__9356, b__9358, c__9360, d__9362)
            }
          }else {
            var e__9364 = cljs.core._first.call(null, args__9363);
            var args__9365 = cljs.core._rest.call(null, args__9363);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__9356, b__9358, c__9360, d__9362, e__9364)
              }else {
                return f.call(null, a__9356, b__9358, c__9360, d__9362, e__9364)
              }
            }else {
              var f__9366 = cljs.core._first.call(null, args__9365);
              var args__9367 = cljs.core._rest.call(null, args__9365);
              if(argc === 6) {
                if(f__9366.cljs$lang$arity$6) {
                  return f__9366.cljs$lang$arity$6(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366)
                }else {
                  return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366)
                }
              }else {
                var g__9368 = cljs.core._first.call(null, args__9367);
                var args__9369 = cljs.core._rest.call(null, args__9367);
                if(argc === 7) {
                  if(f__9366.cljs$lang$arity$7) {
                    return f__9366.cljs$lang$arity$7(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368)
                  }else {
                    return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368)
                  }
                }else {
                  var h__9370 = cljs.core._first.call(null, args__9369);
                  var args__9371 = cljs.core._rest.call(null, args__9369);
                  if(argc === 8) {
                    if(f__9366.cljs$lang$arity$8) {
                      return f__9366.cljs$lang$arity$8(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370)
                    }else {
                      return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370)
                    }
                  }else {
                    var i__9372 = cljs.core._first.call(null, args__9371);
                    var args__9373 = cljs.core._rest.call(null, args__9371);
                    if(argc === 9) {
                      if(f__9366.cljs$lang$arity$9) {
                        return f__9366.cljs$lang$arity$9(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372)
                      }else {
                        return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372)
                      }
                    }else {
                      var j__9374 = cljs.core._first.call(null, args__9373);
                      var args__9375 = cljs.core._rest.call(null, args__9373);
                      if(argc === 10) {
                        if(f__9366.cljs$lang$arity$10) {
                          return f__9366.cljs$lang$arity$10(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374)
                        }else {
                          return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374)
                        }
                      }else {
                        var k__9376 = cljs.core._first.call(null, args__9375);
                        var args__9377 = cljs.core._rest.call(null, args__9375);
                        if(argc === 11) {
                          if(f__9366.cljs$lang$arity$11) {
                            return f__9366.cljs$lang$arity$11(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376)
                          }else {
                            return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376)
                          }
                        }else {
                          var l__9378 = cljs.core._first.call(null, args__9377);
                          var args__9379 = cljs.core._rest.call(null, args__9377);
                          if(argc === 12) {
                            if(f__9366.cljs$lang$arity$12) {
                              return f__9366.cljs$lang$arity$12(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378)
                            }else {
                              return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378)
                            }
                          }else {
                            var m__9380 = cljs.core._first.call(null, args__9379);
                            var args__9381 = cljs.core._rest.call(null, args__9379);
                            if(argc === 13) {
                              if(f__9366.cljs$lang$arity$13) {
                                return f__9366.cljs$lang$arity$13(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380)
                              }else {
                                return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380)
                              }
                            }else {
                              var n__9382 = cljs.core._first.call(null, args__9381);
                              var args__9383 = cljs.core._rest.call(null, args__9381);
                              if(argc === 14) {
                                if(f__9366.cljs$lang$arity$14) {
                                  return f__9366.cljs$lang$arity$14(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382)
                                }else {
                                  return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382)
                                }
                              }else {
                                var o__9384 = cljs.core._first.call(null, args__9383);
                                var args__9385 = cljs.core._rest.call(null, args__9383);
                                if(argc === 15) {
                                  if(f__9366.cljs$lang$arity$15) {
                                    return f__9366.cljs$lang$arity$15(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384)
                                  }else {
                                    return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384)
                                  }
                                }else {
                                  var p__9386 = cljs.core._first.call(null, args__9385);
                                  var args__9387 = cljs.core._rest.call(null, args__9385);
                                  if(argc === 16) {
                                    if(f__9366.cljs$lang$arity$16) {
                                      return f__9366.cljs$lang$arity$16(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386)
                                    }else {
                                      return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386)
                                    }
                                  }else {
                                    var q__9388 = cljs.core._first.call(null, args__9387);
                                    var args__9389 = cljs.core._rest.call(null, args__9387);
                                    if(argc === 17) {
                                      if(f__9366.cljs$lang$arity$17) {
                                        return f__9366.cljs$lang$arity$17(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388)
                                      }else {
                                        return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388)
                                      }
                                    }else {
                                      var r__9390 = cljs.core._first.call(null, args__9389);
                                      var args__9391 = cljs.core._rest.call(null, args__9389);
                                      if(argc === 18) {
                                        if(f__9366.cljs$lang$arity$18) {
                                          return f__9366.cljs$lang$arity$18(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388, r__9390)
                                        }else {
                                          return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388, r__9390)
                                        }
                                      }else {
                                        var s__9392 = cljs.core._first.call(null, args__9391);
                                        var args__9393 = cljs.core._rest.call(null, args__9391);
                                        if(argc === 19) {
                                          if(f__9366.cljs$lang$arity$19) {
                                            return f__9366.cljs$lang$arity$19(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388, r__9390, s__9392)
                                          }else {
                                            return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388, r__9390, s__9392)
                                          }
                                        }else {
                                          var t__9394 = cljs.core._first.call(null, args__9393);
                                          var args__9395 = cljs.core._rest.call(null, args__9393);
                                          if(argc === 20) {
                                            if(f__9366.cljs$lang$arity$20) {
                                              return f__9366.cljs$lang$arity$20(a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388, r__9390, s__9392, t__9394)
                                            }else {
                                              return f__9366.call(null, a__9356, b__9358, c__9360, d__9362, e__9364, f__9366, g__9368, h__9370, i__9372, j__9374, k__9376, l__9378, m__9380, n__9382, o__9384, p__9386, q__9388, r__9390, s__9392, t__9394)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__9396 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9397 = cljs.core.bounded_count.call(null, args, fixed_arity__9396 + 1);
      if(bc__9397 <= fixed_arity__9396) {
        return cljs.core.apply_to.call(null, f, bc__9397, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__9398 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__9399 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9400 = cljs.core.bounded_count.call(null, arglist__9398, fixed_arity__9399 + 1);
      if(bc__9400 <= fixed_arity__9399) {
        return cljs.core.apply_to.call(null, f, bc__9400, arglist__9398)
      }else {
        return f.cljs$lang$applyTo(arglist__9398)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9398))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__9401 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__9402 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9403 = cljs.core.bounded_count.call(null, arglist__9401, fixed_arity__9402 + 1);
      if(bc__9403 <= fixed_arity__9402) {
        return cljs.core.apply_to.call(null, f, bc__9403, arglist__9401)
      }else {
        return f.cljs$lang$applyTo(arglist__9401)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9401))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__9404 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__9405 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__9406 = cljs.core.bounded_count.call(null, arglist__9404, fixed_arity__9405 + 1);
      if(bc__9406 <= fixed_arity__9405) {
        return cljs.core.apply_to.call(null, f, bc__9406, arglist__9404)
      }else {
        return f.cljs$lang$applyTo(arglist__9404)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__9404))
    }
  };
  var apply__6 = function() {
    var G__9410__delegate = function(f, a, b, c, d, args) {
      var arglist__9407 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__9408 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__9409 = cljs.core.bounded_count.call(null, arglist__9407, fixed_arity__9408 + 1);
        if(bc__9409 <= fixed_arity__9408) {
          return cljs.core.apply_to.call(null, f, bc__9409, arglist__9407)
        }else {
          return f.cljs$lang$applyTo(arglist__9407)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__9407))
      }
    };
    var G__9410 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9410__delegate.call(this, f, a, b, c, d, args)
    };
    G__9410.cljs$lang$maxFixedArity = 5;
    G__9410.cljs$lang$applyTo = function(arglist__9411) {
      var f = cljs.core.first(arglist__9411);
      var a = cljs.core.first(cljs.core.next(arglist__9411));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9411)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9411))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9411)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9411)))));
      return G__9410__delegate(f, a, b, c, d, args)
    };
    G__9410.cljs$lang$arity$variadic = G__9410__delegate;
    return G__9410
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__9412) {
    var obj = cljs.core.first(arglist__9412);
    var f = cljs.core.first(cljs.core.next(arglist__9412));
    var args = cljs.core.rest(cljs.core.next(arglist__9412));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__9413__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__9413 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9413__delegate.call(this, x, y, more)
    };
    G__9413.cljs$lang$maxFixedArity = 2;
    G__9413.cljs$lang$applyTo = function(arglist__9414) {
      var x = cljs.core.first(arglist__9414);
      var y = cljs.core.first(cljs.core.next(arglist__9414));
      var more = cljs.core.rest(cljs.core.next(arglist__9414));
      return G__9413__delegate(x, y, more)
    };
    G__9413.cljs$lang$arity$variadic = G__9413__delegate;
    return G__9413
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__9415 = pred;
        var G__9416 = cljs.core.next.call(null, coll);
        pred = G__9415;
        coll = G__9416;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____9417 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____9417)) {
        return or__3548__auto____9417
      }else {
        var G__9418 = pred;
        var G__9419 = cljs.core.next.call(null, coll);
        pred = G__9418;
        coll = G__9419;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__9420 = null;
    var G__9420__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__9420__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__9420__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__9420__3 = function() {
      var G__9421__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__9421 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__9421__delegate.call(this, x, y, zs)
      };
      G__9421.cljs$lang$maxFixedArity = 2;
      G__9421.cljs$lang$applyTo = function(arglist__9422) {
        var x = cljs.core.first(arglist__9422);
        var y = cljs.core.first(cljs.core.next(arglist__9422));
        var zs = cljs.core.rest(cljs.core.next(arglist__9422));
        return G__9421__delegate(x, y, zs)
      };
      G__9421.cljs$lang$arity$variadic = G__9421__delegate;
      return G__9421
    }();
    G__9420 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__9420__0.call(this);
        case 1:
          return G__9420__1.call(this, x);
        case 2:
          return G__9420__2.call(this, x, y);
        default:
          return G__9420__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__9420.cljs$lang$maxFixedArity = 2;
    G__9420.cljs$lang$applyTo = G__9420__3.cljs$lang$applyTo;
    return G__9420
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__9423__delegate = function(args) {
      return x
    };
    var G__9423 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9423__delegate.call(this, args)
    };
    G__9423.cljs$lang$maxFixedArity = 0;
    G__9423.cljs$lang$applyTo = function(arglist__9424) {
      var args = cljs.core.seq(arglist__9424);
      return G__9423__delegate(args)
    };
    G__9423.cljs$lang$arity$variadic = G__9423__delegate;
    return G__9423
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__9428 = null;
      var G__9428__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__9428__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__9428__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__9428__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__9428__4 = function() {
        var G__9429__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9429 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9429__delegate.call(this, x, y, z, args)
        };
        G__9429.cljs$lang$maxFixedArity = 3;
        G__9429.cljs$lang$applyTo = function(arglist__9430) {
          var x = cljs.core.first(arglist__9430);
          var y = cljs.core.first(cljs.core.next(arglist__9430));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9430)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9430)));
          return G__9429__delegate(x, y, z, args)
        };
        G__9429.cljs$lang$arity$variadic = G__9429__delegate;
        return G__9429
      }();
      G__9428 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9428__0.call(this);
          case 1:
            return G__9428__1.call(this, x);
          case 2:
            return G__9428__2.call(this, x, y);
          case 3:
            return G__9428__3.call(this, x, y, z);
          default:
            return G__9428__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9428.cljs$lang$maxFixedArity = 3;
      G__9428.cljs$lang$applyTo = G__9428__4.cljs$lang$applyTo;
      return G__9428
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__9431 = null;
      var G__9431__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__9431__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__9431__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__9431__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__9431__4 = function() {
        var G__9432__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__9432 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9432__delegate.call(this, x, y, z, args)
        };
        G__9432.cljs$lang$maxFixedArity = 3;
        G__9432.cljs$lang$applyTo = function(arglist__9433) {
          var x = cljs.core.first(arglist__9433);
          var y = cljs.core.first(cljs.core.next(arglist__9433));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9433)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9433)));
          return G__9432__delegate(x, y, z, args)
        };
        G__9432.cljs$lang$arity$variadic = G__9432__delegate;
        return G__9432
      }();
      G__9431 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9431__0.call(this);
          case 1:
            return G__9431__1.call(this, x);
          case 2:
            return G__9431__2.call(this, x, y);
          case 3:
            return G__9431__3.call(this, x, y, z);
          default:
            return G__9431__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9431.cljs$lang$maxFixedArity = 3;
      G__9431.cljs$lang$applyTo = G__9431__4.cljs$lang$applyTo;
      return G__9431
    }()
  };
  var comp__4 = function() {
    var G__9434__delegate = function(f1, f2, f3, fs) {
      var fs__9425 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__9435__delegate = function(args) {
          var ret__9426 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__9425), args);
          var fs__9427 = cljs.core.next.call(null, fs__9425);
          while(true) {
            if(cljs.core.truth_(fs__9427)) {
              var G__9436 = cljs.core.first.call(null, fs__9427).call(null, ret__9426);
              var G__9437 = cljs.core.next.call(null, fs__9427);
              ret__9426 = G__9436;
              fs__9427 = G__9437;
              continue
            }else {
              return ret__9426
            }
            break
          }
        };
        var G__9435 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9435__delegate.call(this, args)
        };
        G__9435.cljs$lang$maxFixedArity = 0;
        G__9435.cljs$lang$applyTo = function(arglist__9438) {
          var args = cljs.core.seq(arglist__9438);
          return G__9435__delegate(args)
        };
        G__9435.cljs$lang$arity$variadic = G__9435__delegate;
        return G__9435
      }()
    };
    var G__9434 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9434__delegate.call(this, f1, f2, f3, fs)
    };
    G__9434.cljs$lang$maxFixedArity = 3;
    G__9434.cljs$lang$applyTo = function(arglist__9439) {
      var f1 = cljs.core.first(arglist__9439);
      var f2 = cljs.core.first(cljs.core.next(arglist__9439));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9439)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9439)));
      return G__9434__delegate(f1, f2, f3, fs)
    };
    G__9434.cljs$lang$arity$variadic = G__9434__delegate;
    return G__9434
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__9440__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__9440 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9440__delegate.call(this, args)
      };
      G__9440.cljs$lang$maxFixedArity = 0;
      G__9440.cljs$lang$applyTo = function(arglist__9441) {
        var args = cljs.core.seq(arglist__9441);
        return G__9440__delegate(args)
      };
      G__9440.cljs$lang$arity$variadic = G__9440__delegate;
      return G__9440
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__9442__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__9442 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9442__delegate.call(this, args)
      };
      G__9442.cljs$lang$maxFixedArity = 0;
      G__9442.cljs$lang$applyTo = function(arglist__9443) {
        var args = cljs.core.seq(arglist__9443);
        return G__9442__delegate(args)
      };
      G__9442.cljs$lang$arity$variadic = G__9442__delegate;
      return G__9442
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__9444__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__9444 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__9444__delegate.call(this, args)
      };
      G__9444.cljs$lang$maxFixedArity = 0;
      G__9444.cljs$lang$applyTo = function(arglist__9445) {
        var args = cljs.core.seq(arglist__9445);
        return G__9444__delegate(args)
      };
      G__9444.cljs$lang$arity$variadic = G__9444__delegate;
      return G__9444
    }()
  };
  var partial__5 = function() {
    var G__9446__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__9447__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__9447 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__9447__delegate.call(this, args)
        };
        G__9447.cljs$lang$maxFixedArity = 0;
        G__9447.cljs$lang$applyTo = function(arglist__9448) {
          var args = cljs.core.seq(arglist__9448);
          return G__9447__delegate(args)
        };
        G__9447.cljs$lang$arity$variadic = G__9447__delegate;
        return G__9447
      }()
    };
    var G__9446 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9446__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__9446.cljs$lang$maxFixedArity = 4;
    G__9446.cljs$lang$applyTo = function(arglist__9449) {
      var f = cljs.core.first(arglist__9449);
      var arg1 = cljs.core.first(cljs.core.next(arglist__9449));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9449)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9449))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9449))));
      return G__9446__delegate(f, arg1, arg2, arg3, more)
    };
    G__9446.cljs$lang$arity$variadic = G__9446__delegate;
    return G__9446
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__9450 = null;
      var G__9450__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__9450__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__9450__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__9450__4 = function() {
        var G__9451__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__9451 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9451__delegate.call(this, a, b, c, ds)
        };
        G__9451.cljs$lang$maxFixedArity = 3;
        G__9451.cljs$lang$applyTo = function(arglist__9452) {
          var a = cljs.core.first(arglist__9452);
          var b = cljs.core.first(cljs.core.next(arglist__9452));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9452)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9452)));
          return G__9451__delegate(a, b, c, ds)
        };
        G__9451.cljs$lang$arity$variadic = G__9451__delegate;
        return G__9451
      }();
      G__9450 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__9450__1.call(this, a);
          case 2:
            return G__9450__2.call(this, a, b);
          case 3:
            return G__9450__3.call(this, a, b, c);
          default:
            return G__9450__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9450.cljs$lang$maxFixedArity = 3;
      G__9450.cljs$lang$applyTo = G__9450__4.cljs$lang$applyTo;
      return G__9450
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__9453 = null;
      var G__9453__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9453__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__9453__4 = function() {
        var G__9454__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__9454 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9454__delegate.call(this, a, b, c, ds)
        };
        G__9454.cljs$lang$maxFixedArity = 3;
        G__9454.cljs$lang$applyTo = function(arglist__9455) {
          var a = cljs.core.first(arglist__9455);
          var b = cljs.core.first(cljs.core.next(arglist__9455));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9455)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9455)));
          return G__9454__delegate(a, b, c, ds)
        };
        G__9454.cljs$lang$arity$variadic = G__9454__delegate;
        return G__9454
      }();
      G__9453 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9453__2.call(this, a, b);
          case 3:
            return G__9453__3.call(this, a, b, c);
          default:
            return G__9453__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9453.cljs$lang$maxFixedArity = 3;
      G__9453.cljs$lang$applyTo = G__9453__4.cljs$lang$applyTo;
      return G__9453
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__9456 = null;
      var G__9456__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__9456__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__9456__4 = function() {
        var G__9457__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__9457 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9457__delegate.call(this, a, b, c, ds)
        };
        G__9457.cljs$lang$maxFixedArity = 3;
        G__9457.cljs$lang$applyTo = function(arglist__9458) {
          var a = cljs.core.first(arglist__9458);
          var b = cljs.core.first(cljs.core.next(arglist__9458));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9458)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9458)));
          return G__9457__delegate(a, b, c, ds)
        };
        G__9457.cljs$lang$arity$variadic = G__9457__delegate;
        return G__9457
      }();
      G__9456 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__9456__2.call(this, a, b);
          case 3:
            return G__9456__3.call(this, a, b, c);
          default:
            return G__9456__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9456.cljs$lang$maxFixedArity = 3;
      G__9456.cljs$lang$applyTo = G__9456__4.cljs$lang$applyTo;
      return G__9456
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__9461 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9459 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9459)) {
        var s__9460 = temp__3698__auto____9459;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__9460)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__9460)))
      }else {
        return null
      }
    })
  };
  return mapi__9461.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9462 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9462)) {
      var s__9463 = temp__3698__auto____9462;
      var x__9464 = f.call(null, cljs.core.first.call(null, s__9463));
      if(x__9464 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__9463))
      }else {
        return cljs.core.cons.call(null, x__9464, keep.call(null, f, cljs.core.rest.call(null, s__9463)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__9474 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9471 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9471)) {
        var s__9472 = temp__3698__auto____9471;
        var x__9473 = f.call(null, idx, cljs.core.first.call(null, s__9472));
        if(x__9473 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9472))
        }else {
          return cljs.core.cons.call(null, x__9473, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__9472)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__9474.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9481 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9481)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____9481
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9482 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9482)) {
            var and__3546__auto____9483 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____9483)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____9483
            }
          }else {
            return and__3546__auto____9482
          }
        }())
      };
      var ep1__4 = function() {
        var G__9519__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____9484 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____9484)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____9484
            }
          }())
        };
        var G__9519 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9519__delegate.call(this, x, y, z, args)
        };
        G__9519.cljs$lang$maxFixedArity = 3;
        G__9519.cljs$lang$applyTo = function(arglist__9520) {
          var x = cljs.core.first(arglist__9520);
          var y = cljs.core.first(cljs.core.next(arglist__9520));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9520)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9520)));
          return G__9519__delegate(x, y, z, args)
        };
        G__9519.cljs$lang$arity$variadic = G__9519__delegate;
        return G__9519
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9485 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9485)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____9485
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9486 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9486)) {
            var and__3546__auto____9487 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____9487)) {
              var and__3546__auto____9488 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____9488)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____9488
              }
            }else {
              return and__3546__auto____9487
            }
          }else {
            return and__3546__auto____9486
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9489 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9489)) {
            var and__3546__auto____9490 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____9490)) {
              var and__3546__auto____9491 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____9491)) {
                var and__3546__auto____9492 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____9492)) {
                  var and__3546__auto____9493 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____9493)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____9493
                  }
                }else {
                  return and__3546__auto____9492
                }
              }else {
                return and__3546__auto____9491
              }
            }else {
              return and__3546__auto____9490
            }
          }else {
            return and__3546__auto____9489
          }
        }())
      };
      var ep2__4 = function() {
        var G__9521__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____9494 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____9494)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9465_SHARP_) {
                var and__3546__auto____9495 = p1.call(null, p1__9465_SHARP_);
                if(cljs.core.truth_(and__3546__auto____9495)) {
                  return p2.call(null, p1__9465_SHARP_)
                }else {
                  return and__3546__auto____9495
                }
              }, args)
            }else {
              return and__3546__auto____9494
            }
          }())
        };
        var G__9521 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9521__delegate.call(this, x, y, z, args)
        };
        G__9521.cljs$lang$maxFixedArity = 3;
        G__9521.cljs$lang$applyTo = function(arglist__9522) {
          var x = cljs.core.first(arglist__9522);
          var y = cljs.core.first(cljs.core.next(arglist__9522));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9522)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9522)));
          return G__9521__delegate(x, y, z, args)
        };
        G__9521.cljs$lang$arity$variadic = G__9521__delegate;
        return G__9521
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9496 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9496)) {
            var and__3546__auto____9497 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9497)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____9497
            }
          }else {
            return and__3546__auto____9496
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9498 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9498)) {
            var and__3546__auto____9499 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9499)) {
              var and__3546__auto____9500 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____9500)) {
                var and__3546__auto____9501 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____9501)) {
                  var and__3546__auto____9502 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____9502)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____9502
                  }
                }else {
                  return and__3546__auto____9501
                }
              }else {
                return and__3546__auto____9500
              }
            }else {
              return and__3546__auto____9499
            }
          }else {
            return and__3546__auto____9498
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____9503 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____9503)) {
            var and__3546__auto____9504 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9504)) {
              var and__3546__auto____9505 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____9505)) {
                var and__3546__auto____9506 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____9506)) {
                  var and__3546__auto____9507 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____9507)) {
                    var and__3546__auto____9508 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____9508)) {
                      var and__3546__auto____9509 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____9509)) {
                        var and__3546__auto____9510 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____9510)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____9510
                        }
                      }else {
                        return and__3546__auto____9509
                      }
                    }else {
                      return and__3546__auto____9508
                    }
                  }else {
                    return and__3546__auto____9507
                  }
                }else {
                  return and__3546__auto____9506
                }
              }else {
                return and__3546__auto____9505
              }
            }else {
              return and__3546__auto____9504
            }
          }else {
            return and__3546__auto____9503
          }
        }())
      };
      var ep3__4 = function() {
        var G__9523__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____9511 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____9511)) {
              return cljs.core.every_QMARK_.call(null, function(p1__9466_SHARP_) {
                var and__3546__auto____9512 = p1.call(null, p1__9466_SHARP_);
                if(cljs.core.truth_(and__3546__auto____9512)) {
                  var and__3546__auto____9513 = p2.call(null, p1__9466_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____9513)) {
                    return p3.call(null, p1__9466_SHARP_)
                  }else {
                    return and__3546__auto____9513
                  }
                }else {
                  return and__3546__auto____9512
                }
              }, args)
            }else {
              return and__3546__auto____9511
            }
          }())
        };
        var G__9523 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9523__delegate.call(this, x, y, z, args)
        };
        G__9523.cljs$lang$maxFixedArity = 3;
        G__9523.cljs$lang$applyTo = function(arglist__9524) {
          var x = cljs.core.first(arglist__9524);
          var y = cljs.core.first(cljs.core.next(arglist__9524));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9524)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9524)));
          return G__9523__delegate(x, y, z, args)
        };
        G__9523.cljs$lang$arity$variadic = G__9523__delegate;
        return G__9523
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__9525__delegate = function(p1, p2, p3, ps) {
      var ps__9514 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__9467_SHARP_) {
            return p1__9467_SHARP_.call(null, x)
          }, ps__9514)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__9468_SHARP_) {
            var and__3546__auto____9515 = p1__9468_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9515)) {
              return p1__9468_SHARP_.call(null, y)
            }else {
              return and__3546__auto____9515
            }
          }, ps__9514)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__9469_SHARP_) {
            var and__3546__auto____9516 = p1__9469_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____9516)) {
              var and__3546__auto____9517 = p1__9469_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____9517)) {
                return p1__9469_SHARP_.call(null, z)
              }else {
                return and__3546__auto____9517
              }
            }else {
              return and__3546__auto____9516
            }
          }, ps__9514)
        };
        var epn__4 = function() {
          var G__9526__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____9518 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____9518)) {
                return cljs.core.every_QMARK_.call(null, function(p1__9470_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__9470_SHARP_, args)
                }, ps__9514)
              }else {
                return and__3546__auto____9518
              }
            }())
          };
          var G__9526 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9526__delegate.call(this, x, y, z, args)
          };
          G__9526.cljs$lang$maxFixedArity = 3;
          G__9526.cljs$lang$applyTo = function(arglist__9527) {
            var x = cljs.core.first(arglist__9527);
            var y = cljs.core.first(cljs.core.next(arglist__9527));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9527)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9527)));
            return G__9526__delegate(x, y, z, args)
          };
          G__9526.cljs$lang$arity$variadic = G__9526__delegate;
          return G__9526
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__9525 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9525__delegate.call(this, p1, p2, p3, ps)
    };
    G__9525.cljs$lang$maxFixedArity = 3;
    G__9525.cljs$lang$applyTo = function(arglist__9528) {
      var p1 = cljs.core.first(arglist__9528);
      var p2 = cljs.core.first(cljs.core.next(arglist__9528));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9528)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9528)));
      return G__9525__delegate(p1, p2, p3, ps)
    };
    G__9525.cljs$lang$arity$variadic = G__9525__delegate;
    return G__9525
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3548__auto____9530 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9530)) {
          return or__3548__auto____9530
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____9531 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9531)) {
          return or__3548__auto____9531
        }else {
          var or__3548__auto____9532 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____9532)) {
            return or__3548__auto____9532
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__9568__delegate = function(x, y, z, args) {
          var or__3548__auto____9533 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____9533)) {
            return or__3548__auto____9533
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__9568 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9568__delegate.call(this, x, y, z, args)
        };
        G__9568.cljs$lang$maxFixedArity = 3;
        G__9568.cljs$lang$applyTo = function(arglist__9569) {
          var x = cljs.core.first(arglist__9569);
          var y = cljs.core.first(cljs.core.next(arglist__9569));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9569)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9569)));
          return G__9568__delegate(x, y, z, args)
        };
        G__9568.cljs$lang$arity$variadic = G__9568__delegate;
        return G__9568
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3548__auto____9534 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9534)) {
          return or__3548__auto____9534
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____9535 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9535)) {
          return or__3548__auto____9535
        }else {
          var or__3548__auto____9536 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____9536)) {
            return or__3548__auto____9536
          }else {
            var or__3548__auto____9537 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9537)) {
              return or__3548__auto____9537
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____9538 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9538)) {
          return or__3548__auto____9538
        }else {
          var or__3548__auto____9539 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____9539)) {
            return or__3548__auto____9539
          }else {
            var or__3548__auto____9540 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____9540)) {
              return or__3548__auto____9540
            }else {
              var or__3548__auto____9541 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____9541)) {
                return or__3548__auto____9541
              }else {
                var or__3548__auto____9542 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____9542)) {
                  return or__3548__auto____9542
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__9570__delegate = function(x, y, z, args) {
          var or__3548__auto____9543 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____9543)) {
            return or__3548__auto____9543
          }else {
            return cljs.core.some.call(null, function(p1__9475_SHARP_) {
              var or__3548__auto____9544 = p1.call(null, p1__9475_SHARP_);
              if(cljs.core.truth_(or__3548__auto____9544)) {
                return or__3548__auto____9544
              }else {
                return p2.call(null, p1__9475_SHARP_)
              }
            }, args)
          }
        };
        var G__9570 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9570__delegate.call(this, x, y, z, args)
        };
        G__9570.cljs$lang$maxFixedArity = 3;
        G__9570.cljs$lang$applyTo = function(arglist__9571) {
          var x = cljs.core.first(arglist__9571);
          var y = cljs.core.first(cljs.core.next(arglist__9571));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9571)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9571)));
          return G__9570__delegate(x, y, z, args)
        };
        G__9570.cljs$lang$arity$variadic = G__9570__delegate;
        return G__9570
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3548__auto____9545 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9545)) {
          return or__3548__auto____9545
        }else {
          var or__3548__auto____9546 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____9546)) {
            return or__3548__auto____9546
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____9547 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9547)) {
          return or__3548__auto____9547
        }else {
          var or__3548__auto____9548 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____9548)) {
            return or__3548__auto____9548
          }else {
            var or__3548__auto____9549 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9549)) {
              return or__3548__auto____9549
            }else {
              var or__3548__auto____9550 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____9550)) {
                return or__3548__auto____9550
              }else {
                var or__3548__auto____9551 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____9551)) {
                  return or__3548__auto____9551
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____9552 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____9552)) {
          return or__3548__auto____9552
        }else {
          var or__3548__auto____9553 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____9553)) {
            return or__3548__auto____9553
          }else {
            var or__3548__auto____9554 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9554)) {
              return or__3548__auto____9554
            }else {
              var or__3548__auto____9555 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____9555)) {
                return or__3548__auto____9555
              }else {
                var or__3548__auto____9556 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____9556)) {
                  return or__3548__auto____9556
                }else {
                  var or__3548__auto____9557 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____9557)) {
                    return or__3548__auto____9557
                  }else {
                    var or__3548__auto____9558 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____9558)) {
                      return or__3548__auto____9558
                    }else {
                      var or__3548__auto____9559 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____9559)) {
                        return or__3548__auto____9559
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__9572__delegate = function(x, y, z, args) {
          var or__3548__auto____9560 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____9560)) {
            return or__3548__auto____9560
          }else {
            return cljs.core.some.call(null, function(p1__9476_SHARP_) {
              var or__3548__auto____9561 = p1.call(null, p1__9476_SHARP_);
              if(cljs.core.truth_(or__3548__auto____9561)) {
                return or__3548__auto____9561
              }else {
                var or__3548__auto____9562 = p2.call(null, p1__9476_SHARP_);
                if(cljs.core.truth_(or__3548__auto____9562)) {
                  return or__3548__auto____9562
                }else {
                  return p3.call(null, p1__9476_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__9572 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9572__delegate.call(this, x, y, z, args)
        };
        G__9572.cljs$lang$maxFixedArity = 3;
        G__9572.cljs$lang$applyTo = function(arglist__9573) {
          var x = cljs.core.first(arglist__9573);
          var y = cljs.core.first(cljs.core.next(arglist__9573));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9573)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9573)));
          return G__9572__delegate(x, y, z, args)
        };
        G__9572.cljs$lang$arity$variadic = G__9572__delegate;
        return G__9572
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__9574__delegate = function(p1, p2, p3, ps) {
      var ps__9563 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__9477_SHARP_) {
            return p1__9477_SHARP_.call(null, x)
          }, ps__9563)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__9478_SHARP_) {
            var or__3548__auto____9564 = p1__9478_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9564)) {
              return or__3548__auto____9564
            }else {
              return p1__9478_SHARP_.call(null, y)
            }
          }, ps__9563)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__9479_SHARP_) {
            var or__3548__auto____9565 = p1__9479_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____9565)) {
              return or__3548__auto____9565
            }else {
              var or__3548__auto____9566 = p1__9479_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____9566)) {
                return or__3548__auto____9566
              }else {
                return p1__9479_SHARP_.call(null, z)
              }
            }
          }, ps__9563)
        };
        var spn__4 = function() {
          var G__9575__delegate = function(x, y, z, args) {
            var or__3548__auto____9567 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____9567)) {
              return or__3548__auto____9567
            }else {
              return cljs.core.some.call(null, function(p1__9480_SHARP_) {
                return cljs.core.some.call(null, p1__9480_SHARP_, args)
              }, ps__9563)
            }
          };
          var G__9575 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9575__delegate.call(this, x, y, z, args)
          };
          G__9575.cljs$lang$maxFixedArity = 3;
          G__9575.cljs$lang$applyTo = function(arglist__9576) {
            var x = cljs.core.first(arglist__9576);
            var y = cljs.core.first(cljs.core.next(arglist__9576));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9576)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9576)));
            return G__9575__delegate(x, y, z, args)
          };
          G__9575.cljs$lang$arity$variadic = G__9575__delegate;
          return G__9575
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__9574 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9574__delegate.call(this, p1, p2, p3, ps)
    };
    G__9574.cljs$lang$maxFixedArity = 3;
    G__9574.cljs$lang$applyTo = function(arglist__9577) {
      var p1 = cljs.core.first(arglist__9577);
      var p2 = cljs.core.first(cljs.core.next(arglist__9577));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9577)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9577)));
      return G__9574__delegate(p1, p2, p3, ps)
    };
    G__9574.cljs$lang$arity$variadic = G__9574__delegate;
    return G__9574
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9578 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9578)) {
        var s__9579 = temp__3698__auto____9578;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__9579)), map.call(null, f, cljs.core.rest.call(null, s__9579)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9580 = cljs.core.seq.call(null, c1);
      var s2__9581 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9582 = s1__9580;
        if(cljs.core.truth_(and__3546__auto____9582)) {
          return s2__9581
        }else {
          return and__3546__auto____9582
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9580), cljs.core.first.call(null, s2__9581)), map.call(null, f, cljs.core.rest.call(null, s1__9580), cljs.core.rest.call(null, s2__9581)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9583 = cljs.core.seq.call(null, c1);
      var s2__9584 = cljs.core.seq.call(null, c2);
      var s3__9585 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9586 = s1__9583;
        if(cljs.core.truth_(and__3546__auto____9586)) {
          var and__3546__auto____9587 = s2__9584;
          if(cljs.core.truth_(and__3546__auto____9587)) {
            return s3__9585
          }else {
            return and__3546__auto____9587
          }
        }else {
          return and__3546__auto____9586
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__9583), cljs.core.first.call(null, s2__9584), cljs.core.first.call(null, s3__9585)), map.call(null, f, cljs.core.rest.call(null, s1__9583), cljs.core.rest.call(null, s2__9584), cljs.core.rest.call(null, s3__9585)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__9590__delegate = function(f, c1, c2, c3, colls) {
      var step__9589 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__9588 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9588)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__9588), step.call(null, map.call(null, cljs.core.rest, ss__9588)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__9529_SHARP_) {
        return cljs.core.apply.call(null, f, p1__9529_SHARP_)
      }, step__9589.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__9590 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9590__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9590.cljs$lang$maxFixedArity = 4;
    G__9590.cljs$lang$applyTo = function(arglist__9591) {
      var f = cljs.core.first(arglist__9591);
      var c1 = cljs.core.first(cljs.core.next(arglist__9591));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9591)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9591))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9591))));
      return G__9590__delegate(f, c1, c2, c3, colls)
    };
    G__9590.cljs$lang$arity$variadic = G__9590__delegate;
    return G__9590
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3698__auto____9592 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9592)) {
        var s__9593 = temp__3698__auto____9592;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9593), take.call(null, n - 1, cljs.core.rest.call(null, s__9593)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__9596 = function(n, coll) {
    while(true) {
      var s__9594 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9595 = n > 0;
        if(and__3546__auto____9595) {
          return s__9594
        }else {
          return and__3546__auto____9595
        }
      }())) {
        var G__9597 = n - 1;
        var G__9598 = cljs.core.rest.call(null, s__9594);
        n = G__9597;
        coll = G__9598;
        continue
      }else {
        return s__9594
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9596.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__9599 = cljs.core.seq.call(null, coll);
  var lead__9600 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__9600)) {
      var G__9601 = cljs.core.next.call(null, s__9599);
      var G__9602 = cljs.core.next.call(null, lead__9600);
      s__9599 = G__9601;
      lead__9600 = G__9602;
      continue
    }else {
      return s__9599
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__9605 = function(pred, coll) {
    while(true) {
      var s__9603 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9604 = s__9603;
        if(cljs.core.truth_(and__3546__auto____9604)) {
          return pred.call(null, cljs.core.first.call(null, s__9603))
        }else {
          return and__3546__auto____9604
        }
      }())) {
        var G__9606 = pred;
        var G__9607 = cljs.core.rest.call(null, s__9603);
        pred = G__9606;
        coll = G__9607;
        continue
      }else {
        return s__9603
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__9605.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9608 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9608)) {
      var s__9609 = temp__3698__auto____9608;
      return cljs.core.concat.call(null, s__9609, cycle.call(null, s__9609))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__9610 = cljs.core.seq.call(null, c1);
      var s2__9611 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____9612 = s1__9610;
        if(cljs.core.truth_(and__3546__auto____9612)) {
          return s2__9611
        }else {
          return and__3546__auto____9612
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__9610), cljs.core.cons.call(null, cljs.core.first.call(null, s2__9611), interleave.call(null, cljs.core.rest.call(null, s1__9610), cljs.core.rest.call(null, s2__9611))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__9614__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__9613 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__9613)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__9613), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__9613)))
        }else {
          return null
        }
      })
    };
    var G__9614 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9614__delegate.call(this, c1, c2, colls)
    };
    G__9614.cljs$lang$maxFixedArity = 2;
    G__9614.cljs$lang$applyTo = function(arglist__9615) {
      var c1 = cljs.core.first(arglist__9615);
      var c2 = cljs.core.first(cljs.core.next(arglist__9615));
      var colls = cljs.core.rest(cljs.core.next(arglist__9615));
      return G__9614__delegate(c1, c2, colls)
    };
    G__9614.cljs$lang$arity$variadic = G__9614__delegate;
    return G__9614
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__9618 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____9616 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____9616)) {
        var coll__9617 = temp__3695__auto____9616;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__9617), cat.call(null, cljs.core.rest.call(null, coll__9617), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__9618.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__9619__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__9619 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__9619__delegate.call(this, f, coll, colls)
    };
    G__9619.cljs$lang$maxFixedArity = 2;
    G__9619.cljs$lang$applyTo = function(arglist__9620) {
      var f = cljs.core.first(arglist__9620);
      var coll = cljs.core.first(cljs.core.next(arglist__9620));
      var colls = cljs.core.rest(cljs.core.next(arglist__9620));
      return G__9619__delegate(f, coll, colls)
    };
    G__9619.cljs$lang$arity$variadic = G__9619__delegate;
    return G__9619
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____9621 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____9621)) {
      var s__9622 = temp__3698__auto____9621;
      var f__9623 = cljs.core.first.call(null, s__9622);
      var r__9624 = cljs.core.rest.call(null, s__9622);
      if(cljs.core.truth_(pred.call(null, f__9623))) {
        return cljs.core.cons.call(null, f__9623, filter.call(null, pred, r__9624))
      }else {
        return filter.call(null, pred, r__9624)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__9626 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__9626.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__9625_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__9625_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__9627__9628 = to;
    if(G__9627__9628 != null) {
      if(function() {
        var or__3548__auto____9629 = G__9627__9628.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____9629) {
          return or__3548__auto____9629
        }else {
          return G__9627__9628.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__9627__9628.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9627__9628)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__9627__9628)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__9630__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__9630 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__9630__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__9630.cljs$lang$maxFixedArity = 4;
    G__9630.cljs$lang$applyTo = function(arglist__9631) {
      var f = cljs.core.first(arglist__9631);
      var c1 = cljs.core.first(cljs.core.next(arglist__9631));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9631)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9631))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9631))));
      return G__9630__delegate(f, c1, c2, c3, colls)
    };
    G__9630.cljs$lang$arity$variadic = G__9630__delegate;
    return G__9630
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9632 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9632)) {
        var s__9633 = temp__3698__auto____9632;
        var p__9634 = cljs.core.take.call(null, n, s__9633);
        if(n === cljs.core.count.call(null, p__9634)) {
          return cljs.core.cons.call(null, p__9634, partition.call(null, n, step, cljs.core.drop.call(null, step, s__9633)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____9635 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____9635)) {
        var s__9636 = temp__3698__auto____9635;
        var p__9637 = cljs.core.take.call(null, n, s__9636);
        if(n === cljs.core.count.call(null, p__9637)) {
          return cljs.core.cons.call(null, p__9637, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__9636)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__9637, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__9638 = cljs.core.lookup_sentinel;
    var m__9639 = m;
    var ks__9640 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__9640)) {
        var m__9641 = cljs.core.get.call(null, m__9639, cljs.core.first.call(null, ks__9640), sentinel__9638);
        if(sentinel__9638 === m__9641) {
          return not_found
        }else {
          var G__9642 = sentinel__9638;
          var G__9643 = m__9641;
          var G__9644 = cljs.core.next.call(null, ks__9640);
          sentinel__9638 = G__9642;
          m__9639 = G__9643;
          ks__9640 = G__9644;
          continue
        }
      }else {
        return m__9639
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__9645, v) {
  var vec__9646__9647 = p__9645;
  var k__9648 = cljs.core.nth.call(null, vec__9646__9647, 0, null);
  var ks__9649 = cljs.core.nthnext.call(null, vec__9646__9647, 1);
  if(cljs.core.truth_(ks__9649)) {
    return cljs.core.assoc.call(null, m, k__9648, assoc_in.call(null, cljs.core.get.call(null, m, k__9648), ks__9649, v))
  }else {
    return cljs.core.assoc.call(null, m, k__9648, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__9650, f, args) {
    var vec__9651__9652 = p__9650;
    var k__9653 = cljs.core.nth.call(null, vec__9651__9652, 0, null);
    var ks__9654 = cljs.core.nthnext.call(null, vec__9651__9652, 1);
    if(cljs.core.truth_(ks__9654)) {
      return cljs.core.assoc.call(null, m, k__9653, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__9653), ks__9654, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__9653, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__9653), args))
    }
  };
  var update_in = function(m, p__9650, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__9650, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__9655) {
    var m = cljs.core.first(arglist__9655);
    var p__9650 = cljs.core.first(cljs.core.next(arglist__9655));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9655)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9655)));
    return update_in__delegate(m, p__9650, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9660 = this;
  var h__364__auto____9661 = this__9660.__hash;
  if(h__364__auto____9661 != null) {
    return h__364__auto____9661
  }else {
    var h__364__auto____9662 = cljs.core.hash_coll.call(null, coll);
    this__9660.__hash = h__364__auto____9662;
    return h__364__auto____9662
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9663 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9664 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9665 = this;
  var new_array__9666 = cljs.core.aclone.call(null, this__9665.array);
  new_array__9666[k] = v;
  return new cljs.core.Vector(this__9665.meta, new_array__9666, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__9695 = null;
  var G__9695__2 = function(tsym9658, k) {
    var this__9667 = this;
    var tsym9658__9668 = this;
    var coll__9669 = tsym9658__9668;
    return cljs.core._lookup.call(null, coll__9669, k)
  };
  var G__9695__3 = function(tsym9659, k, not_found) {
    var this__9670 = this;
    var tsym9659__9671 = this;
    var coll__9672 = tsym9659__9671;
    return cljs.core._lookup.call(null, coll__9672, k, not_found)
  };
  G__9695 = function(tsym9659, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9695__2.call(this, tsym9659, k);
      case 3:
        return G__9695__3.call(this, tsym9659, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9695
}();
cljs.core.Vector.prototype.apply = function(tsym9656, args9657) {
  return tsym9656.call.apply(tsym9656, [tsym9656].concat(cljs.core.aclone.call(null, args9657)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9673 = this;
  var new_array__9674 = cljs.core.aclone.call(null, this__9673.array);
  new_array__9674.push(o);
  return new cljs.core.Vector(this__9673.meta, new_array__9674, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__9675 = this;
  var this$__9676 = this;
  return cljs.core.pr_str.call(null, this$__9676)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9677 = this;
  return cljs.core.ci_reduce.call(null, this__9677.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9678 = this;
  return cljs.core.ci_reduce.call(null, this__9678.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9679 = this;
  if(this__9679.array.length > 0) {
    var vector_seq__9680 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__9679.array.length) {
          return cljs.core.cons.call(null, this__9679.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__9680.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9681 = this;
  return this__9681.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9682 = this;
  var count__9683 = this__9682.array.length;
  if(count__9683 > 0) {
    return this__9682.array[count__9683 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9684 = this;
  if(this__9684.array.length > 0) {
    var new_array__9685 = cljs.core.aclone.call(null, this__9684.array);
    new_array__9685.pop();
    return new cljs.core.Vector(this__9684.meta, new_array__9685, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9686 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9687 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9688 = this;
  return new cljs.core.Vector(meta, this__9688.array, this__9688.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9689 = this;
  return this__9689.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9691 = this;
  if(function() {
    var and__3546__auto____9692 = 0 <= n;
    if(and__3546__auto____9692) {
      return n < this__9691.array.length
    }else {
      return and__3546__auto____9692
    }
  }()) {
    return this__9691.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9693 = this;
  if(function() {
    var and__3546__auto____9694 = 0 <= n;
    if(and__3546__auto____9694) {
      return n < this__9693.array.length
    }else {
      return and__3546__auto____9694
    }
  }()) {
    return this__9693.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9690 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9690.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__9696 = pv.cnt;
  if(cnt__9696 < 32) {
    return 0
  }else {
    return cnt__9696 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__9697 = level;
  var ret__9698 = node;
  while(true) {
    if(ll__9697 === 0) {
      return ret__9698
    }else {
      var embed__9699 = ret__9698;
      var r__9700 = cljs.core.pv_fresh_node.call(null, edit);
      var ___9701 = cljs.core.pv_aset.call(null, r__9700, 0, embed__9699);
      var G__9702 = ll__9697 - 5;
      var G__9703 = r__9700;
      ll__9697 = G__9702;
      ret__9698 = G__9703;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__9704 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__9705 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__9704, subidx__9705, tailnode);
    return ret__9704
  }else {
    var temp__3695__auto____9706 = cljs.core.pv_aget.call(null, parent, subidx__9705);
    if(cljs.core.truth_(temp__3695__auto____9706)) {
      var child__9707 = temp__3695__auto____9706;
      var node_to_insert__9708 = push_tail.call(null, pv, level - 5, child__9707, tailnode);
      cljs.core.pv_aset.call(null, ret__9704, subidx__9705, node_to_insert__9708);
      return ret__9704
    }else {
      var node_to_insert__9709 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__9704, subidx__9705, node_to_insert__9709);
      return ret__9704
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____9710 = 0 <= i;
    if(and__3546__auto____9710) {
      return i < pv.cnt
    }else {
      return and__3546__auto____9710
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__9711 = pv.root;
      var level__9712 = pv.shift;
      while(true) {
        if(level__9712 > 0) {
          var G__9713 = cljs.core.pv_aget.call(null, node__9711, i >>> level__9712 & 31);
          var G__9714 = level__9712 - 5;
          node__9711 = G__9713;
          level__9712 = G__9714;
          continue
        }else {
          return node__9711.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__9715 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__9715, i & 31, val);
    return ret__9715
  }else {
    var subidx__9716 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__9715, subidx__9716, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9716), i, val));
    return ret__9715
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__9717 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9718 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__9717));
    if(function() {
      var and__3546__auto____9719 = new_child__9718 == null;
      if(and__3546__auto____9719) {
        return subidx__9717 === 0
      }else {
        return and__3546__auto____9719
      }
    }()) {
      return null
    }else {
      var ret__9720 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__9720, subidx__9717, new_child__9718);
      return ret__9720
    }
  }else {
    if(subidx__9717 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__9721 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__9721, subidx__9717, null);
        return ret__9721
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__9722 = cljs.core._count.call(null, v);
  if(c__9722 > 0) {
    if(void 0 === cljs.core.t9723) {
      cljs.core.t9723 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t9723.cljs$lang$type = true;
      cljs.core.t9723.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t9723")
      };
      cljs.core.t9723.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t9723.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__9724 = this;
        return vseq
      };
      cljs.core.t9723.prototype.cljs$core$ISeq$ = true;
      cljs.core.t9723.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__9725 = this;
        return cljs.core._nth.call(null, this__9725.v, this__9725.offset)
      };
      cljs.core.t9723.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__9726 = this;
        var offset__9727 = this__9726.offset + 1;
        if(offset__9727 < this__9726.c) {
          return this__9726.vector_seq.call(null, this__9726.v, offset__9727)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t9723.prototype.cljs$core$ASeq$ = true;
      cljs.core.t9723.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t9723.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__9728 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t9723.prototype.cljs$core$ISequential$ = true;
      cljs.core.t9723.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t9723.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__9729 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t9723.prototype.cljs$core$IMeta$ = true;
      cljs.core.t9723.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__9730 = this;
        return this__9730.__meta__389__auto__
      };
      cljs.core.t9723.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t9723.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__9731 = this;
        return new cljs.core.t9723(this__9731.c, this__9731.offset, this__9731.v, this__9731.vector_seq, __meta__389__auto__)
      };
      cljs.core.t9723
    }else {
    }
    return new cljs.core.t9723(c__9722, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9736 = this;
  return new cljs.core.TransientVector(this__9736.cnt, this__9736.shift, cljs.core.tv_editable_root.call(null, this__9736.root), cljs.core.tv_editable_tail.call(null, this__9736.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9737 = this;
  var h__364__auto____9738 = this__9737.__hash;
  if(h__364__auto____9738 != null) {
    return h__364__auto____9738
  }else {
    var h__364__auto____9739 = cljs.core.hash_coll.call(null, coll);
    this__9737.__hash = h__364__auto____9739;
    return h__364__auto____9739
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9740 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9741 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9742 = this;
  if(function() {
    var and__3546__auto____9743 = 0 <= k;
    if(and__3546__auto____9743) {
      return k < this__9742.cnt
    }else {
      return and__3546__auto____9743
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__9744 = cljs.core.aclone.call(null, this__9742.tail);
      new_tail__9744[k & 31] = v;
      return new cljs.core.PersistentVector(this__9742.meta, this__9742.cnt, this__9742.shift, this__9742.root, new_tail__9744, null)
    }else {
      return new cljs.core.PersistentVector(this__9742.meta, this__9742.cnt, this__9742.shift, cljs.core.do_assoc.call(null, coll, this__9742.shift, this__9742.root, k, v), this__9742.tail, null)
    }
  }else {
    if(k === this__9742.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__9742.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__9789 = null;
  var G__9789__2 = function(tsym9734, k) {
    var this__9745 = this;
    var tsym9734__9746 = this;
    var coll__9747 = tsym9734__9746;
    return cljs.core._lookup.call(null, coll__9747, k)
  };
  var G__9789__3 = function(tsym9735, k, not_found) {
    var this__9748 = this;
    var tsym9735__9749 = this;
    var coll__9750 = tsym9735__9749;
    return cljs.core._lookup.call(null, coll__9750, k, not_found)
  };
  G__9789 = function(tsym9735, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9789__2.call(this, tsym9735, k);
      case 3:
        return G__9789__3.call(this, tsym9735, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9789
}();
cljs.core.PersistentVector.prototype.apply = function(tsym9732, args9733) {
  return tsym9732.call.apply(tsym9732, [tsym9732].concat(cljs.core.aclone.call(null, args9733)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__9751 = this;
  var step_init__9752 = [0, init];
  var i__9753 = 0;
  while(true) {
    if(i__9753 < this__9751.cnt) {
      var arr__9754 = cljs.core.array_for.call(null, v, i__9753);
      var len__9755 = arr__9754.length;
      var init__9759 = function() {
        var j__9756 = 0;
        var init__9757 = step_init__9752[1];
        while(true) {
          if(j__9756 < len__9755) {
            var init__9758 = f.call(null, init__9757, j__9756 + i__9753, arr__9754[j__9756]);
            if(cljs.core.reduced_QMARK_.call(null, init__9758)) {
              return init__9758
            }else {
              var G__9790 = j__9756 + 1;
              var G__9791 = init__9758;
              j__9756 = G__9790;
              init__9757 = G__9791;
              continue
            }
          }else {
            step_init__9752[0] = len__9755;
            step_init__9752[1] = init__9757;
            return init__9757
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__9759)) {
        return cljs.core.deref.call(null, init__9759)
      }else {
        var G__9792 = i__9753 + step_init__9752[0];
        i__9753 = G__9792;
        continue
      }
    }else {
      return step_init__9752[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9760 = this;
  if(this__9760.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__9761 = cljs.core.aclone.call(null, this__9760.tail);
    new_tail__9761.push(o);
    return new cljs.core.PersistentVector(this__9760.meta, this__9760.cnt + 1, this__9760.shift, this__9760.root, new_tail__9761, null)
  }else {
    var root_overflow_QMARK___9762 = this__9760.cnt >>> 5 > 1 << this__9760.shift;
    var new_shift__9763 = root_overflow_QMARK___9762 ? this__9760.shift + 5 : this__9760.shift;
    var new_root__9765 = root_overflow_QMARK___9762 ? function() {
      var n_r__9764 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__9764, 0, this__9760.root);
      cljs.core.pv_aset.call(null, n_r__9764, 1, cljs.core.new_path.call(null, null, this__9760.shift, new cljs.core.VectorNode(null, this__9760.tail)));
      return n_r__9764
    }() : cljs.core.push_tail.call(null, coll, this__9760.shift, this__9760.root, new cljs.core.VectorNode(null, this__9760.tail));
    return new cljs.core.PersistentVector(this__9760.meta, this__9760.cnt + 1, new_shift__9763, new_root__9765, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__9766 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__9767 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__9768 = this;
  var this$__9769 = this;
  return cljs.core.pr_str.call(null, this$__9769)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__9770 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__9771 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9772 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9773 = this;
  return this__9773.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9774 = this;
  if(this__9774.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__9774.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9775 = this;
  if(this__9775.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__9775.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9775.meta)
    }else {
      if(1 < this__9775.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__9775.meta, this__9775.cnt - 1, this__9775.shift, this__9775.root, this__9775.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__9776 = cljs.core.array_for.call(null, coll, this__9775.cnt - 2);
          var nr__9777 = cljs.core.pop_tail.call(null, coll, this__9775.shift, this__9775.root);
          var new_root__9778 = nr__9777 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__9777;
          var cnt_1__9779 = this__9775.cnt - 1;
          if(function() {
            var and__3546__auto____9780 = 5 < this__9775.shift;
            if(and__3546__auto____9780) {
              return cljs.core.pv_aget.call(null, new_root__9778, 1) == null
            }else {
              return and__3546__auto____9780
            }
          }()) {
            return new cljs.core.PersistentVector(this__9775.meta, cnt_1__9779, this__9775.shift - 5, cljs.core.pv_aget.call(null, new_root__9778, 0), new_tail__9776, null)
          }else {
            return new cljs.core.PersistentVector(this__9775.meta, cnt_1__9779, this__9775.shift, new_root__9778, new_tail__9776, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9782 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9783 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9784 = this;
  return new cljs.core.PersistentVector(meta, this__9784.cnt, this__9784.shift, this__9784.root, this__9784.tail, this__9784.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9785 = this;
  return this__9785.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9786 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9787 = this;
  if(function() {
    var and__3546__auto____9788 = 0 <= n;
    if(and__3546__auto____9788) {
      return n < this__9787.cnt
    }else {
      return and__3546__auto____9788
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9781 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__9781.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__9793 = cljs.core.seq.call(null, xs);
  var out__9794 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__9793)) {
      var G__9795 = cljs.core.next.call(null, xs__9793);
      var G__9796 = cljs.core.conj_BANG_.call(null, out__9794, cljs.core.first.call(null, xs__9793));
      xs__9793 = G__9795;
      out__9794 = G__9796;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9794)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__9797) {
    var args = cljs.core.seq(arglist__9797);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9802 = this;
  var h__364__auto____9803 = this__9802.__hash;
  if(h__364__auto____9803 != null) {
    return h__364__auto____9803
  }else {
    var h__364__auto____9804 = cljs.core.hash_coll.call(null, coll);
    this__9802.__hash = h__364__auto____9804;
    return h__364__auto____9804
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9805 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9806 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__9807 = this;
  var v_pos__9808 = this__9807.start + key;
  return new cljs.core.Subvec(this__9807.meta, cljs.core._assoc.call(null, this__9807.v, v_pos__9808, val), this__9807.start, this__9807.end > v_pos__9808 + 1 ? this__9807.end : v_pos__9808 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__9832 = null;
  var G__9832__2 = function(tsym9800, k) {
    var this__9809 = this;
    var tsym9800__9810 = this;
    var coll__9811 = tsym9800__9810;
    return cljs.core._lookup.call(null, coll__9811, k)
  };
  var G__9832__3 = function(tsym9801, k, not_found) {
    var this__9812 = this;
    var tsym9801__9813 = this;
    var coll__9814 = tsym9801__9813;
    return cljs.core._lookup.call(null, coll__9814, k, not_found)
  };
  G__9832 = function(tsym9801, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9832__2.call(this, tsym9801, k);
      case 3:
        return G__9832__3.call(this, tsym9801, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9832
}();
cljs.core.Subvec.prototype.apply = function(tsym9798, args9799) {
  return tsym9798.call.apply(tsym9798, [tsym9798].concat(cljs.core.aclone.call(null, args9799)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9815 = this;
  return new cljs.core.Subvec(this__9815.meta, cljs.core._assoc_n.call(null, this__9815.v, this__9815.end, o), this__9815.start, this__9815.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__9816 = this;
  var this$__9817 = this;
  return cljs.core.pr_str.call(null, this$__9817)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__9818 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__9819 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9820 = this;
  var subvec_seq__9821 = function subvec_seq(i) {
    if(i === this__9820.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__9820.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__9821.call(null, this__9820.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9822 = this;
  return this__9822.end - this__9822.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9823 = this;
  return cljs.core._nth.call(null, this__9823.v, this__9823.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9824 = this;
  if(this__9824.start === this__9824.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__9824.meta, this__9824.v, this__9824.start, this__9824.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__9825 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9826 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9827 = this;
  return new cljs.core.Subvec(meta, this__9827.v, this__9827.start, this__9827.end, this__9827.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9828 = this;
  return this__9828.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9830 = this;
  return cljs.core._nth.call(null, this__9830.v, this__9830.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9831 = this;
  return cljs.core._nth.call(null, this__9831.v, this__9831.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9829 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__9829.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__9833 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__9833, 0, tl.length);
  return ret__9833
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__9834 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__9835 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__9834, subidx__9835, level === 5 ? tail_node : function() {
    var child__9836 = cljs.core.pv_aget.call(null, ret__9834, subidx__9835);
    if(child__9836 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__9836, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__9834
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__9837 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__9838 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__9839 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__9837, subidx__9838));
    if(function() {
      var and__3546__auto____9840 = new_child__9839 == null;
      if(and__3546__auto____9840) {
        return subidx__9838 === 0
      }else {
        return and__3546__auto____9840
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__9837, subidx__9838, new_child__9839);
      return node__9837
    }
  }else {
    if(subidx__9838 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__9837, subidx__9838, null);
        return node__9837
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____9841 = 0 <= i;
    if(and__3546__auto____9841) {
      return i < tv.cnt
    }else {
      return and__3546__auto____9841
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__9842 = tv.root;
      var node__9843 = root__9842;
      var level__9844 = tv.shift;
      while(true) {
        if(level__9844 > 0) {
          var G__9845 = cljs.core.tv_ensure_editable.call(null, root__9842.edit, cljs.core.pv_aget.call(null, node__9843, i >>> level__9844 & 31));
          var G__9846 = level__9844 - 5;
          node__9843 = G__9845;
          level__9844 = G__9846;
          continue
        }else {
          return node__9843.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__9884 = null;
  var G__9884__2 = function(tsym9849, k) {
    var this__9851 = this;
    var tsym9849__9852 = this;
    var coll__9853 = tsym9849__9852;
    return cljs.core._lookup.call(null, coll__9853, k)
  };
  var G__9884__3 = function(tsym9850, k, not_found) {
    var this__9854 = this;
    var tsym9850__9855 = this;
    var coll__9856 = tsym9850__9855;
    return cljs.core._lookup.call(null, coll__9856, k, not_found)
  };
  G__9884 = function(tsym9850, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9884__2.call(this, tsym9850, k);
      case 3:
        return G__9884__3.call(this, tsym9850, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9884
}();
cljs.core.TransientVector.prototype.apply = function(tsym9847, args9848) {
  return tsym9847.call.apply(tsym9847, [tsym9847].concat(cljs.core.aclone.call(null, args9848)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9857 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9858 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__9859 = this;
  if(cljs.core.truth_(this__9859.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__9860 = this;
  if(function() {
    var and__3546__auto____9861 = 0 <= n;
    if(and__3546__auto____9861) {
      return n < this__9860.cnt
    }else {
      return and__3546__auto____9861
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9862 = this;
  if(cljs.core.truth_(this__9862.root.edit)) {
    return this__9862.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__9863 = this;
  if(cljs.core.truth_(this__9863.root.edit)) {
    if(function() {
      var and__3546__auto____9864 = 0 <= n;
      if(and__3546__auto____9864) {
        return n < this__9863.cnt
      }else {
        return and__3546__auto____9864
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__9863.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__9867 = function go(level, node) {
          var node__9865 = cljs.core.tv_ensure_editable.call(null, this__9863.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__9865, n & 31, val);
            return node__9865
          }else {
            var subidx__9866 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__9865, subidx__9866, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__9865, subidx__9866)));
            return node__9865
          }
        }.call(null, this__9863.shift, this__9863.root);
        this__9863.root = new_root__9867;
        return tcoll
      }
    }else {
      if(n === this__9863.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__9863.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__9868 = this;
  if(cljs.core.truth_(this__9868.root.edit)) {
    if(this__9868.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__9868.cnt) {
        this__9868.cnt = 0;
        return tcoll
      }else {
        if((this__9868.cnt - 1 & 31) > 0) {
          this__9868.cnt = this__9868.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__9869 = cljs.core.editable_array_for.call(null, tcoll, this__9868.cnt - 2);
            var new_root__9871 = function() {
              var nr__9870 = cljs.core.tv_pop_tail.call(null, tcoll, this__9868.shift, this__9868.root);
              if(nr__9870 != null) {
                return nr__9870
              }else {
                return new cljs.core.VectorNode(this__9868.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____9872 = 5 < this__9868.shift;
              if(and__3546__auto____9872) {
                return cljs.core.pv_aget.call(null, new_root__9871, 1) == null
              }else {
                return and__3546__auto____9872
              }
            }()) {
              var new_root__9873 = cljs.core.tv_ensure_editable.call(null, this__9868.root.edit, cljs.core.pv_aget.call(null, new_root__9871, 0));
              this__9868.root = new_root__9873;
              this__9868.shift = this__9868.shift - 5;
              this__9868.cnt = this__9868.cnt - 1;
              this__9868.tail = new_tail__9869;
              return tcoll
            }else {
              this__9868.root = new_root__9871;
              this__9868.cnt = this__9868.cnt - 1;
              this__9868.tail = new_tail__9869;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__9874 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9875 = this;
  if(cljs.core.truth_(this__9875.root.edit)) {
    if(this__9875.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__9875.tail[this__9875.cnt & 31] = o;
      this__9875.cnt = this__9875.cnt + 1;
      return tcoll
    }else {
      var tail_node__9876 = new cljs.core.VectorNode(this__9875.root.edit, this__9875.tail);
      var new_tail__9877 = cljs.core.make_array.call(null, 32);
      new_tail__9877[0] = o;
      this__9875.tail = new_tail__9877;
      if(this__9875.cnt >>> 5 > 1 << this__9875.shift) {
        var new_root_array__9878 = cljs.core.make_array.call(null, 32);
        var new_shift__9879 = this__9875.shift + 5;
        new_root_array__9878[0] = this__9875.root;
        new_root_array__9878[1] = cljs.core.new_path.call(null, this__9875.root.edit, this__9875.shift, tail_node__9876);
        this__9875.root = new cljs.core.VectorNode(this__9875.root.edit, new_root_array__9878);
        this__9875.shift = new_shift__9879;
        this__9875.cnt = this__9875.cnt + 1;
        return tcoll
      }else {
        var new_root__9880 = cljs.core.tv_push_tail.call(null, tcoll, this__9875.shift, this__9875.root, tail_node__9876);
        this__9875.root = new_root__9880;
        this__9875.cnt = this__9875.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9881 = this;
  if(cljs.core.truth_(this__9881.root.edit)) {
    this__9881.root.edit = null;
    var len__9882 = this__9881.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__9883 = cljs.core.make_array.call(null, len__9882);
    cljs.core.array_copy.call(null, this__9881.tail, 0, trimmed_tail__9883, 0, len__9882);
    return new cljs.core.PersistentVector(null, this__9881.cnt, this__9881.shift, this__9881.root, trimmed_tail__9883, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9885 = this;
  var h__364__auto____9886 = this__9885.__hash;
  if(h__364__auto____9886 != null) {
    return h__364__auto____9886
  }else {
    var h__364__auto____9887 = cljs.core.hash_coll.call(null, coll);
    this__9885.__hash = h__364__auto____9887;
    return h__364__auto____9887
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9888 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__9889 = this;
  var this$__9890 = this;
  return cljs.core.pr_str.call(null, this$__9890)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9891 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9892 = this;
  return cljs.core._first.call(null, this__9892.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9893 = this;
  var temp__3695__auto____9894 = cljs.core.next.call(null, this__9893.front);
  if(cljs.core.truth_(temp__3695__auto____9894)) {
    var f1__9895 = temp__3695__auto____9894;
    return new cljs.core.PersistentQueueSeq(this__9893.meta, f1__9895, this__9893.rear, null)
  }else {
    if(this__9893.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__9893.meta, this__9893.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9896 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9897 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__9897.front, this__9897.rear, this__9897.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9898 = this;
  return this__9898.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9899 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9899.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9900 = this;
  var h__364__auto____9901 = this__9900.__hash;
  if(h__364__auto____9901 != null) {
    return h__364__auto____9901
  }else {
    var h__364__auto____9902 = cljs.core.hash_coll.call(null, coll);
    this__9900.__hash = h__364__auto____9902;
    return h__364__auto____9902
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9903 = this;
  if(cljs.core.truth_(this__9903.front)) {
    return new cljs.core.PersistentQueue(this__9903.meta, this__9903.count + 1, this__9903.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____9904 = this__9903.rear;
      if(cljs.core.truth_(or__3548__auto____9904)) {
        return or__3548__auto____9904
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__9903.meta, this__9903.count + 1, cljs.core.conj.call(null, this__9903.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__9905 = this;
  var this$__9906 = this;
  return cljs.core.pr_str.call(null, this$__9906)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9907 = this;
  var rear__9908 = cljs.core.seq.call(null, this__9907.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____9909 = this__9907.front;
    if(cljs.core.truth_(or__3548__auto____9909)) {
      return or__3548__auto____9909
    }else {
      return rear__9908
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__9907.front, cljs.core.seq.call(null, rear__9908), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9910 = this;
  return this__9910.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__9911 = this;
  return cljs.core._first.call(null, this__9911.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__9912 = this;
  if(cljs.core.truth_(this__9912.front)) {
    var temp__3695__auto____9913 = cljs.core.next.call(null, this__9912.front);
    if(cljs.core.truth_(temp__3695__auto____9913)) {
      var f1__9914 = temp__3695__auto____9913;
      return new cljs.core.PersistentQueue(this__9912.meta, this__9912.count - 1, f1__9914, this__9912.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__9912.meta, this__9912.count - 1, cljs.core.seq.call(null, this__9912.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__9915 = this;
  return cljs.core.first.call(null, this__9915.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__9916 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9917 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9918 = this;
  return new cljs.core.PersistentQueue(meta, this__9918.count, this__9918.front, this__9918.rear, this__9918.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9919 = this;
  return this__9919.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9920 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9921 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__9922 = array.length;
  var i__9923 = 0;
  while(true) {
    if(i__9923 < len__9922) {
      if(cljs.core._EQ_.call(null, k, array[i__9923])) {
        return i__9923
      }else {
        var G__9924 = i__9923 + incr;
        i__9923 = G__9924;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9925 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____9925)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____9925
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__9926 = cljs.core.hash.call(null, a);
  var b__9927 = cljs.core.hash.call(null, b);
  if(a__9926 < b__9927) {
    return-1
  }else {
    if(a__9926 > b__9927) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__9929 = m.keys;
  var len__9930 = ks__9929.length;
  var so__9931 = m.strobj;
  var out__9932 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__9933 = 0;
  var out__9934 = cljs.core.transient$.call(null, out__9932);
  while(true) {
    if(i__9933 < len__9930) {
      var k__9935 = ks__9929[i__9933];
      var G__9936 = i__9933 + 1;
      var G__9937 = cljs.core.assoc_BANG_.call(null, out__9934, k__9935, so__9931[k__9935]);
      i__9933 = G__9936;
      out__9934 = G__9937;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__9934, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9942 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9943 = this;
  var h__364__auto____9944 = this__9943.__hash;
  if(h__364__auto____9944 != null) {
    return h__364__auto____9944
  }else {
    var h__364__auto____9945 = cljs.core.hash_imap.call(null, coll);
    this__9943.__hash = h__364__auto____9945;
    return h__364__auto____9945
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9946 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9947 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__9947.strobj, this__9947.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9948 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___9949 = this__9948.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___9949)) {
      var new_strobj__9950 = goog.object.clone.call(null, this__9948.strobj);
      new_strobj__9950[k] = v;
      return new cljs.core.ObjMap(this__9948.meta, this__9948.keys, new_strobj__9950, this__9948.update_count + 1, null)
    }else {
      if(this__9948.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__9951 = goog.object.clone.call(null, this__9948.strobj);
        var new_keys__9952 = cljs.core.aclone.call(null, this__9948.keys);
        new_strobj__9951[k] = v;
        new_keys__9952.push(k);
        return new cljs.core.ObjMap(this__9948.meta, new_keys__9952, new_strobj__9951, this__9948.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9953 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__9953.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__9973 = null;
  var G__9973__2 = function(tsym9940, k) {
    var this__9954 = this;
    var tsym9940__9955 = this;
    var coll__9956 = tsym9940__9955;
    return cljs.core._lookup.call(null, coll__9956, k)
  };
  var G__9973__3 = function(tsym9941, k, not_found) {
    var this__9957 = this;
    var tsym9941__9958 = this;
    var coll__9959 = tsym9941__9958;
    return cljs.core._lookup.call(null, coll__9959, k, not_found)
  };
  G__9973 = function(tsym9941, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9973__2.call(this, tsym9941, k);
      case 3:
        return G__9973__3.call(this, tsym9941, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9973
}();
cljs.core.ObjMap.prototype.apply = function(tsym9938, args9939) {
  return tsym9938.call.apply(tsym9938, [tsym9938].concat(cljs.core.aclone.call(null, args9939)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9960 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__9961 = this;
  var this$__9962 = this;
  return cljs.core.pr_str.call(null, this$__9962)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9963 = this;
  if(this__9963.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__9928_SHARP_) {
      return cljs.core.vector.call(null, p1__9928_SHARP_, this__9963.strobj[p1__9928_SHARP_])
    }, this__9963.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9964 = this;
  return this__9964.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9965 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9966 = this;
  return new cljs.core.ObjMap(meta, this__9966.keys, this__9966.strobj, this__9966.update_count, this__9966.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9967 = this;
  return this__9967.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9968 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__9968.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9969 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____9970 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____9970)) {
      return this__9969.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____9970
    }
  }())) {
    var new_keys__9971 = cljs.core.aclone.call(null, this__9969.keys);
    var new_strobj__9972 = goog.object.clone.call(null, this__9969.strobj);
    new_keys__9971.splice(cljs.core.scan_array.call(null, 1, k, new_keys__9971), 1);
    cljs.core.js_delete.call(null, new_strobj__9972, k);
    return new cljs.core.ObjMap(this__9969.meta, new_keys__9971, new_strobj__9972, this__9969.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9979 = this;
  var h__364__auto____9980 = this__9979.__hash;
  if(h__364__auto____9980 != null) {
    return h__364__auto____9980
  }else {
    var h__364__auto____9981 = cljs.core.hash_imap.call(null, coll);
    this__9979.__hash = h__364__auto____9981;
    return h__364__auto____9981
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9982 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9983 = this;
  var bucket__9984 = this__9983.hashobj[cljs.core.hash.call(null, k)];
  var i__9985 = cljs.core.truth_(bucket__9984) ? cljs.core.scan_array.call(null, 2, k, bucket__9984) : null;
  if(cljs.core.truth_(i__9985)) {
    return bucket__9984[i__9985 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9986 = this;
  var h__9987 = cljs.core.hash.call(null, k);
  var bucket__9988 = this__9986.hashobj[h__9987];
  if(cljs.core.truth_(bucket__9988)) {
    var new_bucket__9989 = cljs.core.aclone.call(null, bucket__9988);
    var new_hashobj__9990 = goog.object.clone.call(null, this__9986.hashobj);
    new_hashobj__9990[h__9987] = new_bucket__9989;
    var temp__3695__auto____9991 = cljs.core.scan_array.call(null, 2, k, new_bucket__9989);
    if(cljs.core.truth_(temp__3695__auto____9991)) {
      var i__9992 = temp__3695__auto____9991;
      new_bucket__9989[i__9992 + 1] = v;
      return new cljs.core.HashMap(this__9986.meta, this__9986.count, new_hashobj__9990, null)
    }else {
      new_bucket__9989.push(k, v);
      return new cljs.core.HashMap(this__9986.meta, this__9986.count + 1, new_hashobj__9990, null)
    }
  }else {
    var new_hashobj__9993 = goog.object.clone.call(null, this__9986.hashobj);
    new_hashobj__9993[h__9987] = [k, v];
    return new cljs.core.HashMap(this__9986.meta, this__9986.count + 1, new_hashobj__9993, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9994 = this;
  var bucket__9995 = this__9994.hashobj[cljs.core.hash.call(null, k)];
  var i__9996 = cljs.core.truth_(bucket__9995) ? cljs.core.scan_array.call(null, 2, k, bucket__9995) : null;
  if(cljs.core.truth_(i__9996)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__10019 = null;
  var G__10019__2 = function(tsym9977, k) {
    var this__9997 = this;
    var tsym9977__9998 = this;
    var coll__9999 = tsym9977__9998;
    return cljs.core._lookup.call(null, coll__9999, k)
  };
  var G__10019__3 = function(tsym9978, k, not_found) {
    var this__10000 = this;
    var tsym9978__10001 = this;
    var coll__10002 = tsym9978__10001;
    return cljs.core._lookup.call(null, coll__10002, k, not_found)
  };
  G__10019 = function(tsym9978, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10019__2.call(this, tsym9978, k);
      case 3:
        return G__10019__3.call(this, tsym9978, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10019
}();
cljs.core.HashMap.prototype.apply = function(tsym9975, args9976) {
  return tsym9975.call.apply(tsym9975, [tsym9975].concat(cljs.core.aclone.call(null, args9976)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10003 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__10004 = this;
  var this$__10005 = this;
  return cljs.core.pr_str.call(null, this$__10005)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10006 = this;
  if(this__10006.count > 0) {
    var hashes__10007 = cljs.core.js_keys.call(null, this__10006.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__9974_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__10006.hashobj[p1__9974_SHARP_]))
    }, hashes__10007)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10008 = this;
  return this__10008.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10009 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10010 = this;
  return new cljs.core.HashMap(meta, this__10010.count, this__10010.hashobj, this__10010.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10011 = this;
  return this__10011.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10012 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__10012.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10013 = this;
  var h__10014 = cljs.core.hash.call(null, k);
  var bucket__10015 = this__10013.hashobj[h__10014];
  var i__10016 = cljs.core.truth_(bucket__10015) ? cljs.core.scan_array.call(null, 2, k, bucket__10015) : null;
  if(cljs.core.not.call(null, i__10016)) {
    return coll
  }else {
    var new_hashobj__10017 = goog.object.clone.call(null, this__10013.hashobj);
    if(3 > bucket__10015.length) {
      cljs.core.js_delete.call(null, new_hashobj__10017, h__10014)
    }else {
      var new_bucket__10018 = cljs.core.aclone.call(null, bucket__10015);
      new_bucket__10018.splice(i__10016, 2);
      new_hashobj__10017[h__10014] = new_bucket__10018
    }
    return new cljs.core.HashMap(this__10013.meta, this__10013.count - 1, new_hashobj__10017, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__10020 = ks.length;
  var i__10021 = 0;
  var out__10022 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__10021 < len__10020) {
      var G__10023 = i__10021 + 1;
      var G__10024 = cljs.core.assoc.call(null, out__10022, ks[i__10021], vs[i__10021]);
      i__10021 = G__10023;
      out__10022 = G__10024;
      continue
    }else {
      return out__10022
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__10025 = m.arr;
  var len__10026 = arr__10025.length;
  var i__10027 = 0;
  while(true) {
    if(len__10026 <= i__10027) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__10025[i__10027], k)) {
        return i__10027
      }else {
        if("\ufdd0'else") {
          var G__10028 = i__10027 + 2;
          i__10027 = G__10028;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10033 = this;
  return new cljs.core.TransientArrayMap({}, this__10033.arr.length, cljs.core.aclone.call(null, this__10033.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10034 = this;
  var h__364__auto____10035 = this__10034.__hash;
  if(h__364__auto____10035 != null) {
    return h__364__auto____10035
  }else {
    var h__364__auto____10036 = cljs.core.hash_imap.call(null, coll);
    this__10034.__hash = h__364__auto____10036;
    return h__364__auto____10036
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10037 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10038 = this;
  var idx__10039 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10039 === -1) {
    return not_found
  }else {
    return this__10038.arr[idx__10039 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10040 = this;
  var idx__10041 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10041 === -1) {
    if(this__10040.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__10040.meta, this__10040.cnt + 1, function() {
        var G__10042__10043 = cljs.core.aclone.call(null, this__10040.arr);
        G__10042__10043.push(k);
        G__10042__10043.push(v);
        return G__10042__10043
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__10040.arr[idx__10041 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__10040.meta, this__10040.cnt, function() {
          var G__10044__10045 = cljs.core.aclone.call(null, this__10040.arr);
          G__10044__10045[idx__10041 + 1] = v;
          return G__10044__10045
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10046 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__10076 = null;
  var G__10076__2 = function(tsym10031, k) {
    var this__10047 = this;
    var tsym10031__10048 = this;
    var coll__10049 = tsym10031__10048;
    return cljs.core._lookup.call(null, coll__10049, k)
  };
  var G__10076__3 = function(tsym10032, k, not_found) {
    var this__10050 = this;
    var tsym10032__10051 = this;
    var coll__10052 = tsym10032__10051;
    return cljs.core._lookup.call(null, coll__10052, k, not_found)
  };
  G__10076 = function(tsym10032, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10076__2.call(this, tsym10032, k);
      case 3:
        return G__10076__3.call(this, tsym10032, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10076
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym10029, args10030) {
  return tsym10029.call.apply(tsym10029, [tsym10029].concat(cljs.core.aclone.call(null, args10030)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10053 = this;
  var len__10054 = this__10053.arr.length;
  var i__10055 = 0;
  var init__10056 = init;
  while(true) {
    if(i__10055 < len__10054) {
      var init__10057 = f.call(null, init__10056, this__10053.arr[i__10055], this__10053.arr[i__10055 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__10057)) {
        return cljs.core.deref.call(null, init__10057)
      }else {
        var G__10077 = i__10055 + 2;
        var G__10078 = init__10057;
        i__10055 = G__10077;
        init__10056 = G__10078;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10058 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__10059 = this;
  var this$__10060 = this;
  return cljs.core.pr_str.call(null, this$__10060)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10061 = this;
  if(this__10061.cnt > 0) {
    var len__10062 = this__10061.arr.length;
    var array_map_seq__10063 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__10062) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__10061.arr[i], this__10061.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__10063.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10064 = this;
  return this__10064.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10065 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10066 = this;
  return new cljs.core.PersistentArrayMap(meta, this__10066.cnt, this__10066.arr, this__10066.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10067 = this;
  return this__10067.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10068 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__10068.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10069 = this;
  var idx__10070 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__10070 >= 0) {
    var len__10071 = this__10069.arr.length;
    var new_len__10072 = len__10071 - 2;
    if(new_len__10072 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__10073 = cljs.core.make_array.call(null, new_len__10072);
      var s__10074 = 0;
      var d__10075 = 0;
      while(true) {
        if(s__10074 >= len__10071) {
          return new cljs.core.PersistentArrayMap(this__10069.meta, this__10069.cnt - 1, new_arr__10073, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__10069.arr[s__10074])) {
            var G__10079 = s__10074 + 2;
            var G__10080 = d__10075;
            s__10074 = G__10079;
            d__10075 = G__10080;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__10073[d__10075] = this__10069.arr[s__10074];
              new_arr__10073[d__10075 + 1] = this__10069.arr[s__10074 + 1];
              var G__10081 = s__10074 + 2;
              var G__10082 = d__10075 + 2;
              s__10074 = G__10081;
              d__10075 = G__10082;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__10083 = cljs.core.count.call(null, ks);
  var i__10084 = 0;
  var out__10085 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__10084 < len__10083) {
      var G__10086 = i__10084 + 1;
      var G__10087 = cljs.core.assoc_BANG_.call(null, out__10085, ks[i__10084], vs[i__10084]);
      i__10084 = G__10086;
      out__10085 = G__10087;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10085)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__10088 = this;
  if(cljs.core.truth_(this__10088.editable_QMARK_)) {
    var idx__10089 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10089 >= 0) {
      this__10088.arr[idx__10089] = this__10088.arr[this__10088.len - 2];
      this__10088.arr[idx__10089 + 1] = this__10088.arr[this__10088.len - 1];
      var G__10090__10091 = this__10088.arr;
      G__10090__10091.pop();
      G__10090__10091.pop();
      G__10090__10091;
      this__10088.len = this__10088.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10092 = this;
  if(cljs.core.truth_(this__10092.editable_QMARK_)) {
    var idx__10093 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__10093 === -1) {
      if(this__10092.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__10092.len = this__10092.len + 2;
        this__10092.arr.push(key);
        this__10092.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__10092.len, this__10092.arr), key, val)
      }
    }else {
      if(val === this__10092.arr[idx__10093 + 1]) {
        return tcoll
      }else {
        this__10092.arr[idx__10093 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10094 = this;
  if(cljs.core.truth_(this__10094.editable_QMARK_)) {
    if(function() {
      var G__10095__10096 = o;
      if(G__10095__10096 != null) {
        if(function() {
          var or__3548__auto____10097 = G__10095__10096.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____10097) {
            return or__3548__auto____10097
          }else {
            return G__10095__10096.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10095__10096.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10095__10096)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10095__10096)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10098 = cljs.core.seq.call(null, o);
      var tcoll__10099 = tcoll;
      while(true) {
        var temp__3695__auto____10100 = cljs.core.first.call(null, es__10098);
        if(cljs.core.truth_(temp__3695__auto____10100)) {
          var e__10101 = temp__3695__auto____10100;
          var G__10107 = cljs.core.next.call(null, es__10098);
          var G__10108 = cljs.core._assoc_BANG_.call(null, tcoll__10099, cljs.core.key.call(null, e__10101), cljs.core.val.call(null, e__10101));
          es__10098 = G__10107;
          tcoll__10099 = G__10108;
          continue
        }else {
          return tcoll__10099
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10102 = this;
  if(cljs.core.truth_(this__10102.editable_QMARK_)) {
    this__10102.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__10102.len, 2), this__10102.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10103 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10104 = this;
  if(cljs.core.truth_(this__10104.editable_QMARK_)) {
    var idx__10105 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__10105 === -1) {
      return not_found
    }else {
      return this__10104.arr[idx__10105 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10106 = this;
  if(cljs.core.truth_(this__10106.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__10106.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__10109 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__10110 = 0;
  while(true) {
    if(i__10110 < len) {
      var G__10111 = cljs.core.assoc_BANG_.call(null, out__10109, arr[i__10110], arr[i__10110 + 1]);
      var G__10112 = i__10110 + 2;
      out__10109 = G__10111;
      i__10110 = G__10112;
      continue
    }else {
      return out__10109
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__10113__10114 = cljs.core.aclone.call(null, arr);
    G__10113__10114[i] = a;
    return G__10113__10114
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__10115__10116 = cljs.core.aclone.call(null, arr);
    G__10115__10116[i] = a;
    G__10115__10116[j] = b;
    return G__10115__10116
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__10117 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__10117, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__10117, 2 * i, new_arr__10117.length - 2 * i);
  return new_arr__10117
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__10118 = inode.ensure_editable(edit);
    editable__10118.arr[i] = a;
    return editable__10118
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__10119 = inode.ensure_editable(edit);
    editable__10119.arr[i] = a;
    editable__10119.arr[j] = b;
    return editable__10119
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__10120 = arr.length;
  var i__10121 = 0;
  var init__10122 = init;
  while(true) {
    if(i__10121 < len__10120) {
      var init__10125 = function() {
        var k__10123 = arr[i__10121];
        if(k__10123 != null) {
          return f.call(null, init__10122, k__10123, arr[i__10121 + 1])
        }else {
          var node__10124 = arr[i__10121 + 1];
          if(node__10124 != null) {
            return node__10124.kv_reduce(f, init__10122)
          }else {
            return init__10122
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__10125)) {
        return cljs.core.deref.call(null, init__10125)
      }else {
        var G__10126 = i__10121 + 2;
        var G__10127 = init__10125;
        i__10121 = G__10126;
        init__10122 = G__10127;
        continue
      }
    }else {
      return init__10122
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__10128 = this;
  var inode__10129 = this;
  if(this__10128.bitmap === bit) {
    return null
  }else {
    var editable__10130 = inode__10129.ensure_editable(e);
    var earr__10131 = editable__10130.arr;
    var len__10132 = earr__10131.length;
    editable__10130.bitmap = bit ^ editable__10130.bitmap;
    cljs.core.array_copy.call(null, earr__10131, 2 * (i + 1), earr__10131, 2 * i, len__10132 - 2 * (i + 1));
    earr__10131[len__10132 - 2] = null;
    earr__10131[len__10132 - 1] = null;
    return editable__10130
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10133 = this;
  var inode__10134 = this;
  var bit__10135 = 1 << (hash >>> shift & 31);
  var idx__10136 = cljs.core.bitmap_indexed_node_index.call(null, this__10133.bitmap, bit__10135);
  if((this__10133.bitmap & bit__10135) === 0) {
    var n__10137 = cljs.core.bit_count.call(null, this__10133.bitmap);
    if(2 * n__10137 < this__10133.arr.length) {
      var editable__10138 = inode__10134.ensure_editable(edit);
      var earr__10139 = editable__10138.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__10139, 2 * idx__10136, earr__10139, 2 * (idx__10136 + 1), 2 * (n__10137 - idx__10136));
      earr__10139[2 * idx__10136] = key;
      earr__10139[2 * idx__10136 + 1] = val;
      editable__10138.bitmap = editable__10138.bitmap | bit__10135;
      return editable__10138
    }else {
      if(n__10137 >= 16) {
        var nodes__10140 = cljs.core.make_array.call(null, 32);
        var jdx__10141 = hash >>> shift & 31;
        nodes__10140[jdx__10141] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__10142 = 0;
        var j__10143 = 0;
        while(true) {
          if(i__10142 < 32) {
            if((this__10133.bitmap >>> i__10142 & 1) === 0) {
              var G__10196 = i__10142 + 1;
              var G__10197 = j__10143;
              i__10142 = G__10196;
              j__10143 = G__10197;
              continue
            }else {
              nodes__10140[i__10142] = null != this__10133.arr[j__10143] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__10133.arr[j__10143]), this__10133.arr[j__10143], this__10133.arr[j__10143 + 1], added_leaf_QMARK_) : this__10133.arr[j__10143 + 1];
              var G__10198 = i__10142 + 1;
              var G__10199 = j__10143 + 2;
              i__10142 = G__10198;
              j__10143 = G__10199;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__10137 + 1, nodes__10140)
      }else {
        if("\ufdd0'else") {
          var new_arr__10144 = cljs.core.make_array.call(null, 2 * (n__10137 + 4));
          cljs.core.array_copy.call(null, this__10133.arr, 0, new_arr__10144, 0, 2 * idx__10136);
          new_arr__10144[2 * idx__10136] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__10144[2 * idx__10136 + 1] = val;
          cljs.core.array_copy.call(null, this__10133.arr, 2 * idx__10136, new_arr__10144, 2 * (idx__10136 + 1), 2 * (n__10137 - idx__10136));
          var editable__10145 = inode__10134.ensure_editable(edit);
          editable__10145.arr = new_arr__10144;
          editable__10145.bitmap = editable__10145.bitmap | bit__10135;
          return editable__10145
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__10146 = this__10133.arr[2 * idx__10136];
    var val_or_node__10147 = this__10133.arr[2 * idx__10136 + 1];
    if(null == key_or_nil__10146) {
      var n__10148 = val_or_node__10147.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10148 === val_or_node__10147) {
        return inode__10134
      }else {
        return cljs.core.edit_and_set.call(null, inode__10134, edit, 2 * idx__10136 + 1, n__10148)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10146)) {
        if(val === val_or_node__10147) {
          return inode__10134
        }else {
          return cljs.core.edit_and_set.call(null, inode__10134, edit, 2 * idx__10136 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__10134, edit, 2 * idx__10136, null, 2 * idx__10136 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__10146, val_or_node__10147, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__10149 = this;
  var inode__10150 = this;
  return cljs.core.create_inode_seq.call(null, this__10149.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10151 = this;
  var inode__10152 = this;
  var bit__10153 = 1 << (hash >>> shift & 31);
  if((this__10151.bitmap & bit__10153) === 0) {
    return inode__10152
  }else {
    var idx__10154 = cljs.core.bitmap_indexed_node_index.call(null, this__10151.bitmap, bit__10153);
    var key_or_nil__10155 = this__10151.arr[2 * idx__10154];
    var val_or_node__10156 = this__10151.arr[2 * idx__10154 + 1];
    if(null == key_or_nil__10155) {
      var n__10157 = val_or_node__10156.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__10157 === val_or_node__10156) {
        return inode__10152
      }else {
        if(null != n__10157) {
          return cljs.core.edit_and_set.call(null, inode__10152, edit, 2 * idx__10154 + 1, n__10157)
        }else {
          if(this__10151.bitmap === bit__10153) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__10152.edit_and_remove_pair(edit, bit__10153, idx__10154)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10155)) {
        removed_leaf_QMARK_[0] = true;
        return inode__10152.edit_and_remove_pair(edit, bit__10153, idx__10154)
      }else {
        if("\ufdd0'else") {
          return inode__10152
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__10158 = this;
  var inode__10159 = this;
  if(e === this__10158.edit) {
    return inode__10159
  }else {
    var n__10160 = cljs.core.bit_count.call(null, this__10158.bitmap);
    var new_arr__10161 = cljs.core.make_array.call(null, n__10160 < 0 ? 4 : 2 * (n__10160 + 1));
    cljs.core.array_copy.call(null, this__10158.arr, 0, new_arr__10161, 0, 2 * n__10160);
    return new cljs.core.BitmapIndexedNode(e, this__10158.bitmap, new_arr__10161)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__10162 = this;
  var inode__10163 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10162.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__10200 = null;
  var G__10200__3 = function(shift, hash, key) {
    var this__10164 = this;
    var inode__10165 = this;
    var bit__10166 = 1 << (hash >>> shift & 31);
    if((this__10164.bitmap & bit__10166) === 0) {
      return null
    }else {
      var idx__10167 = cljs.core.bitmap_indexed_node_index.call(null, this__10164.bitmap, bit__10166);
      var key_or_nil__10168 = this__10164.arr[2 * idx__10167];
      var val_or_node__10169 = this__10164.arr[2 * idx__10167 + 1];
      if(null == key_or_nil__10168) {
        return val_or_node__10169.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__10168)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__10168, val_or_node__10169])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__10200__4 = function(shift, hash, key, not_found) {
    var this__10170 = this;
    var inode__10171 = this;
    var bit__10172 = 1 << (hash >>> shift & 31);
    if((this__10170.bitmap & bit__10172) === 0) {
      return not_found
    }else {
      var idx__10173 = cljs.core.bitmap_indexed_node_index.call(null, this__10170.bitmap, bit__10172);
      var key_or_nil__10174 = this__10170.arr[2 * idx__10173];
      var val_or_node__10175 = this__10170.arr[2 * idx__10173 + 1];
      if(null == key_or_nil__10174) {
        return val_or_node__10175.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__10174)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__10174, val_or_node__10175])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__10200 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10200__3.call(this, shift, hash, key);
      case 4:
        return G__10200__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10200
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__10176 = this;
  var inode__10177 = this;
  var bit__10178 = 1 << (hash >>> shift & 31);
  if((this__10176.bitmap & bit__10178) === 0) {
    return inode__10177
  }else {
    var idx__10179 = cljs.core.bitmap_indexed_node_index.call(null, this__10176.bitmap, bit__10178);
    var key_or_nil__10180 = this__10176.arr[2 * idx__10179];
    var val_or_node__10181 = this__10176.arr[2 * idx__10179 + 1];
    if(null == key_or_nil__10180) {
      var n__10182 = val_or_node__10181.inode_without(shift + 5, hash, key);
      if(n__10182 === val_or_node__10181) {
        return inode__10177
      }else {
        if(null != n__10182) {
          return new cljs.core.BitmapIndexedNode(null, this__10176.bitmap, cljs.core.clone_and_set.call(null, this__10176.arr, 2 * idx__10179 + 1, n__10182))
        }else {
          if(this__10176.bitmap === bit__10178) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__10176.bitmap ^ bit__10178, cljs.core.remove_pair.call(null, this__10176.arr, idx__10179))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10180)) {
        return new cljs.core.BitmapIndexedNode(null, this__10176.bitmap ^ bit__10178, cljs.core.remove_pair.call(null, this__10176.arr, idx__10179))
      }else {
        if("\ufdd0'else") {
          return inode__10177
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10183 = this;
  var inode__10184 = this;
  var bit__10185 = 1 << (hash >>> shift & 31);
  var idx__10186 = cljs.core.bitmap_indexed_node_index.call(null, this__10183.bitmap, bit__10185);
  if((this__10183.bitmap & bit__10185) === 0) {
    var n__10187 = cljs.core.bit_count.call(null, this__10183.bitmap);
    if(n__10187 >= 16) {
      var nodes__10188 = cljs.core.make_array.call(null, 32);
      var jdx__10189 = hash >>> shift & 31;
      nodes__10188[jdx__10189] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__10190 = 0;
      var j__10191 = 0;
      while(true) {
        if(i__10190 < 32) {
          if((this__10183.bitmap >>> i__10190 & 1) === 0) {
            var G__10201 = i__10190 + 1;
            var G__10202 = j__10191;
            i__10190 = G__10201;
            j__10191 = G__10202;
            continue
          }else {
            nodes__10188[i__10190] = null != this__10183.arr[j__10191] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__10183.arr[j__10191]), this__10183.arr[j__10191], this__10183.arr[j__10191 + 1], added_leaf_QMARK_) : this__10183.arr[j__10191 + 1];
            var G__10203 = i__10190 + 1;
            var G__10204 = j__10191 + 2;
            i__10190 = G__10203;
            j__10191 = G__10204;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__10187 + 1, nodes__10188)
    }else {
      var new_arr__10192 = cljs.core.make_array.call(null, 2 * (n__10187 + 1));
      cljs.core.array_copy.call(null, this__10183.arr, 0, new_arr__10192, 0, 2 * idx__10186);
      new_arr__10192[2 * idx__10186] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__10192[2 * idx__10186 + 1] = val;
      cljs.core.array_copy.call(null, this__10183.arr, 2 * idx__10186, new_arr__10192, 2 * (idx__10186 + 1), 2 * (n__10187 - idx__10186));
      return new cljs.core.BitmapIndexedNode(null, this__10183.bitmap | bit__10185, new_arr__10192)
    }
  }else {
    var key_or_nil__10193 = this__10183.arr[2 * idx__10186];
    var val_or_node__10194 = this__10183.arr[2 * idx__10186 + 1];
    if(null == key_or_nil__10193) {
      var n__10195 = val_or_node__10194.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__10195 === val_or_node__10194) {
        return inode__10184
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__10183.bitmap, cljs.core.clone_and_set.call(null, this__10183.arr, 2 * idx__10186 + 1, n__10195))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__10193)) {
        if(val === val_or_node__10194) {
          return inode__10184
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__10183.bitmap, cljs.core.clone_and_set.call(null, this__10183.arr, 2 * idx__10186 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__10183.bitmap, cljs.core.clone_and_set.call(null, this__10183.arr, 2 * idx__10186, null, 2 * idx__10186 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__10193, val_or_node__10194, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__10205 = array_node.arr;
  var len__10206 = 2 * (array_node.cnt - 1);
  var new_arr__10207 = cljs.core.make_array.call(null, len__10206);
  var i__10208 = 0;
  var j__10209 = 1;
  var bitmap__10210 = 0;
  while(true) {
    if(i__10208 < len__10206) {
      if(function() {
        var and__3546__auto____10211 = i__10208 != idx;
        if(and__3546__auto____10211) {
          return null != arr__10205[i__10208]
        }else {
          return and__3546__auto____10211
        }
      }()) {
        new_arr__10207[j__10209] = arr__10205[i__10208];
        var G__10212 = i__10208 + 1;
        var G__10213 = j__10209 + 2;
        var G__10214 = bitmap__10210 | 1 << i__10208;
        i__10208 = G__10212;
        j__10209 = G__10213;
        bitmap__10210 = G__10214;
        continue
      }else {
        var G__10215 = i__10208 + 1;
        var G__10216 = j__10209;
        var G__10217 = bitmap__10210;
        i__10208 = G__10215;
        j__10209 = G__10216;
        bitmap__10210 = G__10217;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__10210, new_arr__10207)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10218 = this;
  var inode__10219 = this;
  var idx__10220 = hash >>> shift & 31;
  var node__10221 = this__10218.arr[idx__10220];
  if(null == node__10221) {
    return new cljs.core.ArrayNode(null, this__10218.cnt + 1, cljs.core.clone_and_set.call(null, this__10218.arr, idx__10220, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__10222 = node__10221.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10222 === node__10221) {
      return inode__10219
    }else {
      return new cljs.core.ArrayNode(null, this__10218.cnt, cljs.core.clone_and_set.call(null, this__10218.arr, idx__10220, n__10222))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__10223 = this;
  var inode__10224 = this;
  var idx__10225 = hash >>> shift & 31;
  var node__10226 = this__10223.arr[idx__10225];
  if(null != node__10226) {
    var n__10227 = node__10226.inode_without(shift + 5, hash, key);
    if(n__10227 === node__10226) {
      return inode__10224
    }else {
      if(n__10227 == null) {
        if(this__10223.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10224, null, idx__10225)
        }else {
          return new cljs.core.ArrayNode(null, this__10223.cnt - 1, cljs.core.clone_and_set.call(null, this__10223.arr, idx__10225, n__10227))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__10223.cnt, cljs.core.clone_and_set.call(null, this__10223.arr, idx__10225, n__10227))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__10224
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__10259 = null;
  var G__10259__3 = function(shift, hash, key) {
    var this__10228 = this;
    var inode__10229 = this;
    var idx__10230 = hash >>> shift & 31;
    var node__10231 = this__10228.arr[idx__10230];
    if(null != node__10231) {
      return node__10231.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__10259__4 = function(shift, hash, key, not_found) {
    var this__10232 = this;
    var inode__10233 = this;
    var idx__10234 = hash >>> shift & 31;
    var node__10235 = this__10232.arr[idx__10234];
    if(null != node__10235) {
      return node__10235.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__10259 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10259__3.call(this, shift, hash, key);
      case 4:
        return G__10259__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10259
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__10236 = this;
  var inode__10237 = this;
  return cljs.core.create_array_node_seq.call(null, this__10236.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__10238 = this;
  var inode__10239 = this;
  if(e === this__10238.edit) {
    return inode__10239
  }else {
    return new cljs.core.ArrayNode(e, this__10238.cnt, cljs.core.aclone.call(null, this__10238.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10240 = this;
  var inode__10241 = this;
  var idx__10242 = hash >>> shift & 31;
  var node__10243 = this__10240.arr[idx__10242];
  if(null == node__10243) {
    var editable__10244 = cljs.core.edit_and_set.call(null, inode__10241, edit, idx__10242, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__10244.cnt = editable__10244.cnt + 1;
    return editable__10244
  }else {
    var n__10245 = node__10243.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__10245 === node__10243) {
      return inode__10241
    }else {
      return cljs.core.edit_and_set.call(null, inode__10241, edit, idx__10242, n__10245)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10246 = this;
  var inode__10247 = this;
  var idx__10248 = hash >>> shift & 31;
  var node__10249 = this__10246.arr[idx__10248];
  if(null == node__10249) {
    return inode__10247
  }else {
    var n__10250 = node__10249.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__10250 === node__10249) {
      return inode__10247
    }else {
      if(null == n__10250) {
        if(this__10246.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__10247, edit, idx__10248)
        }else {
          var editable__10251 = cljs.core.edit_and_set.call(null, inode__10247, edit, idx__10248, n__10250);
          editable__10251.cnt = editable__10251.cnt - 1;
          return editable__10251
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__10247, edit, idx__10248, n__10250)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__10252 = this;
  var inode__10253 = this;
  var len__10254 = this__10252.arr.length;
  var i__10255 = 0;
  var init__10256 = init;
  while(true) {
    if(i__10255 < len__10254) {
      var node__10257 = this__10252.arr[i__10255];
      if(node__10257 != null) {
        var init__10258 = node__10257.kv_reduce(f, init__10256);
        if(cljs.core.reduced_QMARK_.call(null, init__10258)) {
          return cljs.core.deref.call(null, init__10258)
        }else {
          var G__10260 = i__10255 + 1;
          var G__10261 = init__10258;
          i__10255 = G__10260;
          init__10256 = G__10261;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__10256
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__10262 = 2 * cnt;
  var i__10263 = 0;
  while(true) {
    if(i__10263 < lim__10262) {
      if(cljs.core._EQ_.call(null, key, arr[i__10263])) {
        return i__10263
      }else {
        var G__10264 = i__10263 + 2;
        i__10263 = G__10264;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__10265 = this;
  var inode__10266 = this;
  if(hash === this__10265.collision_hash) {
    var idx__10267 = cljs.core.hash_collision_node_find_index.call(null, this__10265.arr, this__10265.cnt, key);
    if(idx__10267 === -1) {
      var len__10268 = this__10265.arr.length;
      var new_arr__10269 = cljs.core.make_array.call(null, len__10268 + 2);
      cljs.core.array_copy.call(null, this__10265.arr, 0, new_arr__10269, 0, len__10268);
      new_arr__10269[len__10268] = key;
      new_arr__10269[len__10268 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__10265.collision_hash, this__10265.cnt + 1, new_arr__10269)
    }else {
      if(cljs.core._EQ_.call(null, this__10265.arr[idx__10267], val)) {
        return inode__10266
      }else {
        return new cljs.core.HashCollisionNode(null, this__10265.collision_hash, this__10265.cnt, cljs.core.clone_and_set.call(null, this__10265.arr, idx__10267 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__10265.collision_hash >>> shift & 31), [null, inode__10266])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__10270 = this;
  var inode__10271 = this;
  var idx__10272 = cljs.core.hash_collision_node_find_index.call(null, this__10270.arr, this__10270.cnt, key);
  if(idx__10272 === -1) {
    return inode__10271
  }else {
    if(this__10270.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__10270.collision_hash, this__10270.cnt - 1, cljs.core.remove_pair.call(null, this__10270.arr, cljs.core.quot.call(null, idx__10272, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__10299 = null;
  var G__10299__3 = function(shift, hash, key) {
    var this__10273 = this;
    var inode__10274 = this;
    var idx__10275 = cljs.core.hash_collision_node_find_index.call(null, this__10273.arr, this__10273.cnt, key);
    if(idx__10275 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__10273.arr[idx__10275])) {
        return cljs.core.PersistentVector.fromArray([this__10273.arr[idx__10275], this__10273.arr[idx__10275 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__10299__4 = function(shift, hash, key, not_found) {
    var this__10276 = this;
    var inode__10277 = this;
    var idx__10278 = cljs.core.hash_collision_node_find_index.call(null, this__10276.arr, this__10276.cnt, key);
    if(idx__10278 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__10276.arr[idx__10278])) {
        return cljs.core.PersistentVector.fromArray([this__10276.arr[idx__10278], this__10276.arr[idx__10278 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__10299 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__10299__3.call(this, shift, hash, key);
      case 4:
        return G__10299__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10299
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__10279 = this;
  var inode__10280 = this;
  return cljs.core.create_inode_seq.call(null, this__10279.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__10300 = null;
  var G__10300__1 = function(e) {
    var this__10281 = this;
    var inode__10282 = this;
    if(e === this__10281.edit) {
      return inode__10282
    }else {
      var new_arr__10283 = cljs.core.make_array.call(null, 2 * (this__10281.cnt + 1));
      cljs.core.array_copy.call(null, this__10281.arr, 0, new_arr__10283, 0, 2 * this__10281.cnt);
      return new cljs.core.HashCollisionNode(e, this__10281.collision_hash, this__10281.cnt, new_arr__10283)
    }
  };
  var G__10300__3 = function(e, count, array) {
    var this__10284 = this;
    var inode__10285 = this;
    if(e === this__10284.edit) {
      this__10284.arr = array;
      this__10284.cnt = count;
      return inode__10285
    }else {
      return new cljs.core.HashCollisionNode(this__10284.edit, this__10284.collision_hash, count, array)
    }
  };
  G__10300 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__10300__1.call(this, e);
      case 3:
        return G__10300__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10300
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__10286 = this;
  var inode__10287 = this;
  if(hash === this__10286.collision_hash) {
    var idx__10288 = cljs.core.hash_collision_node_find_index.call(null, this__10286.arr, this__10286.cnt, key);
    if(idx__10288 === -1) {
      if(this__10286.arr.length > 2 * this__10286.cnt) {
        var editable__10289 = cljs.core.edit_and_set.call(null, inode__10287, edit, 2 * this__10286.cnt, key, 2 * this__10286.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__10289.cnt = editable__10289.cnt + 1;
        return editable__10289
      }else {
        var len__10290 = this__10286.arr.length;
        var new_arr__10291 = cljs.core.make_array.call(null, len__10290 + 2);
        cljs.core.array_copy.call(null, this__10286.arr, 0, new_arr__10291, 0, len__10290);
        new_arr__10291[len__10290] = key;
        new_arr__10291[len__10290 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__10287.ensure_editable(edit, this__10286.cnt + 1, new_arr__10291)
      }
    }else {
      if(this__10286.arr[idx__10288 + 1] === val) {
        return inode__10287
      }else {
        return cljs.core.edit_and_set.call(null, inode__10287, edit, idx__10288 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__10286.collision_hash >>> shift & 31), [null, inode__10287, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__10292 = this;
  var inode__10293 = this;
  var idx__10294 = cljs.core.hash_collision_node_find_index.call(null, this__10292.arr, this__10292.cnt, key);
  if(idx__10294 === -1) {
    return inode__10293
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__10292.cnt === 1) {
      return null
    }else {
      var editable__10295 = inode__10293.ensure_editable(edit);
      var earr__10296 = editable__10295.arr;
      earr__10296[idx__10294] = earr__10296[2 * this__10292.cnt - 2];
      earr__10296[idx__10294 + 1] = earr__10296[2 * this__10292.cnt - 1];
      earr__10296[2 * this__10292.cnt - 1] = null;
      earr__10296[2 * this__10292.cnt - 2] = null;
      editable__10295.cnt = editable__10295.cnt - 1;
      return editable__10295
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__10297 = this;
  var inode__10298 = this;
  return cljs.core.inode_kv_reduce.call(null, this__10297.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10301 = cljs.core.hash.call(null, key1);
    if(key1hash__10301 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10301, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10302 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__10301, key1, val1, added_leaf_QMARK___10302).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___10302)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__10303 = cljs.core.hash.call(null, key1);
    if(key1hash__10303 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__10303, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___10304 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__10303, key1, val1, added_leaf_QMARK___10304).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___10304)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10305 = this;
  var h__364__auto____10306 = this__10305.__hash;
  if(h__364__auto____10306 != null) {
    return h__364__auto____10306
  }else {
    var h__364__auto____10307 = cljs.core.hash_coll.call(null, coll);
    this__10305.__hash = h__364__auto____10307;
    return h__364__auto____10307
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10308 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__10309 = this;
  var this$__10310 = this;
  return cljs.core.pr_str.call(null, this$__10310)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10311 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10312 = this;
  if(this__10312.s == null) {
    return cljs.core.PersistentVector.fromArray([this__10312.nodes[this__10312.i], this__10312.nodes[this__10312.i + 1]])
  }else {
    return cljs.core.first.call(null, this__10312.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10313 = this;
  if(this__10313.s == null) {
    return cljs.core.create_inode_seq.call(null, this__10313.nodes, this__10313.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__10313.nodes, this__10313.i, cljs.core.next.call(null, this__10313.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10314 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10315 = this;
  return new cljs.core.NodeSeq(meta, this__10315.nodes, this__10315.i, this__10315.s, this__10315.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10316 = this;
  return this__10316.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10317 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10317.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__10318 = nodes.length;
      var j__10319 = i;
      while(true) {
        if(j__10319 < len__10318) {
          if(null != nodes[j__10319]) {
            return new cljs.core.NodeSeq(null, nodes, j__10319, null, null)
          }else {
            var temp__3695__auto____10320 = nodes[j__10319 + 1];
            if(cljs.core.truth_(temp__3695__auto____10320)) {
              var node__10321 = temp__3695__auto____10320;
              var temp__3695__auto____10322 = node__10321.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____10322)) {
                var node_seq__10323 = temp__3695__auto____10322;
                return new cljs.core.NodeSeq(null, nodes, j__10319 + 2, node_seq__10323, null)
              }else {
                var G__10324 = j__10319 + 2;
                j__10319 = G__10324;
                continue
              }
            }else {
              var G__10325 = j__10319 + 2;
              j__10319 = G__10325;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10326 = this;
  var h__364__auto____10327 = this__10326.__hash;
  if(h__364__auto____10327 != null) {
    return h__364__auto____10327
  }else {
    var h__364__auto____10328 = cljs.core.hash_coll.call(null, coll);
    this__10326.__hash = h__364__auto____10328;
    return h__364__auto____10328
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10329 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__10330 = this;
  var this$__10331 = this;
  return cljs.core.pr_str.call(null, this$__10331)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10332 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__10333 = this;
  return cljs.core.first.call(null, this__10333.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__10334 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__10334.nodes, this__10334.i, cljs.core.next.call(null, this__10334.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10335 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10336 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__10336.nodes, this__10336.i, this__10336.s, this__10336.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10337 = this;
  return this__10337.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10338 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10338.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__10339 = nodes.length;
      var j__10340 = i;
      while(true) {
        if(j__10340 < len__10339) {
          var temp__3695__auto____10341 = nodes[j__10340];
          if(cljs.core.truth_(temp__3695__auto____10341)) {
            var nj__10342 = temp__3695__auto____10341;
            var temp__3695__auto____10343 = nj__10342.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____10343)) {
              var ns__10344 = temp__3695__auto____10343;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__10340 + 1, ns__10344, null)
            }else {
              var G__10345 = j__10340 + 1;
              j__10340 = G__10345;
              continue
            }
          }else {
            var G__10346 = j__10340 + 1;
            j__10340 = G__10346;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10351 = this;
  return new cljs.core.TransientHashMap({}, this__10351.root, this__10351.cnt, this__10351.has_nil_QMARK_, this__10351.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10352 = this;
  var h__364__auto____10353 = this__10352.__hash;
  if(h__364__auto____10353 != null) {
    return h__364__auto____10353
  }else {
    var h__364__auto____10354 = cljs.core.hash_imap.call(null, coll);
    this__10352.__hash = h__364__auto____10354;
    return h__364__auto____10354
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10355 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10356 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10356.has_nil_QMARK_)) {
      return this__10356.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10356.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__10356.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10357 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10358 = this__10357.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____10358)) {
        return v === this__10357.nil_val
      }else {
        return and__3546__auto____10358
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10357.meta, cljs.core.truth_(this__10357.has_nil_QMARK_) ? this__10357.cnt : this__10357.cnt + 1, this__10357.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___10359 = [false];
    var new_root__10360 = (this__10357.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10357.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10359);
    if(new_root__10360 === this__10357.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__10357.meta, cljs.core.truth_(added_leaf_QMARK___10359[0]) ? this__10357.cnt + 1 : this__10357.cnt, new_root__10360, this__10357.has_nil_QMARK_, this__10357.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10361 = this;
  if(k == null) {
    return this__10361.has_nil_QMARK_
  }else {
    if(this__10361.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__10361.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__10382 = null;
  var G__10382__2 = function(tsym10349, k) {
    var this__10362 = this;
    var tsym10349__10363 = this;
    var coll__10364 = tsym10349__10363;
    return cljs.core._lookup.call(null, coll__10364, k)
  };
  var G__10382__3 = function(tsym10350, k, not_found) {
    var this__10365 = this;
    var tsym10350__10366 = this;
    var coll__10367 = tsym10350__10366;
    return cljs.core._lookup.call(null, coll__10367, k, not_found)
  };
  G__10382 = function(tsym10350, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10382__2.call(this, tsym10350, k);
      case 3:
        return G__10382__3.call(this, tsym10350, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10382
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym10347, args10348) {
  return tsym10347.call.apply(tsym10347, [tsym10347].concat(cljs.core.aclone.call(null, args10348)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10368 = this;
  var init__10369 = cljs.core.truth_(this__10368.has_nil_QMARK_) ? f.call(null, init, null, this__10368.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__10369)) {
    return cljs.core.deref.call(null, init__10369)
  }else {
    if(null != this__10368.root) {
      return this__10368.root.kv_reduce(f, init__10369)
    }else {
      if("\ufdd0'else") {
        return init__10369
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10370 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__10371 = this;
  var this$__10372 = this;
  return cljs.core.pr_str.call(null, this$__10372)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10373 = this;
  if(this__10373.cnt > 0) {
    var s__10374 = null != this__10373.root ? this__10373.root.inode_seq() : null;
    if(cljs.core.truth_(this__10373.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__10373.nil_val]), s__10374)
    }else {
      return s__10374
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10375 = this;
  return this__10375.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10376 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10377 = this;
  return new cljs.core.PersistentHashMap(meta, this__10377.cnt, this__10377.root, this__10377.has_nil_QMARK_, this__10377.nil_val, this__10377.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10378 = this;
  return this__10378.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10379 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__10379.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10380 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10380.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__10380.meta, this__10380.cnt - 1, this__10380.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__10380.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__10381 = this__10380.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__10381 === this__10380.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__10380.meta, this__10380.cnt - 1, new_root__10381, this__10380.has_nil_QMARK_, this__10380.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__10383 = ks.length;
  var i__10384 = 0;
  var out__10385 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__10384 < len__10383) {
      var G__10386 = i__10384 + 1;
      var G__10387 = cljs.core.assoc_BANG_.call(null, out__10385, ks[i__10384], vs[i__10384]);
      i__10384 = G__10386;
      out__10385 = G__10387;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10385)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__10388 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__10389 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__10390 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10391 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__10392 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10392.has_nil_QMARK_)) {
      return this__10392.nil_val
    }else {
      return null
    }
  }else {
    if(this__10392.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__10392.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__10393 = this;
  if(k == null) {
    if(cljs.core.truth_(this__10393.has_nil_QMARK_)) {
      return this__10393.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__10393.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__10393.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10394 = this;
  if(cljs.core.truth_(this__10394.edit)) {
    return this__10394.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__10395 = this;
  var tcoll__10396 = this;
  if(cljs.core.truth_(this__10395.edit)) {
    if(function() {
      var G__10397__10398 = o;
      if(G__10397__10398 != null) {
        if(function() {
          var or__3548__auto____10399 = G__10397__10398.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____10399) {
            return or__3548__auto____10399
          }else {
            return G__10397__10398.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__10397__10398.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10397__10398)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__10397__10398)
      }
    }()) {
      return tcoll__10396.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__10400 = cljs.core.seq.call(null, o);
      var tcoll__10401 = tcoll__10396;
      while(true) {
        var temp__3695__auto____10402 = cljs.core.first.call(null, es__10400);
        if(cljs.core.truth_(temp__3695__auto____10402)) {
          var e__10403 = temp__3695__auto____10402;
          var G__10414 = cljs.core.next.call(null, es__10400);
          var G__10415 = tcoll__10401.assoc_BANG_(cljs.core.key.call(null, e__10403), cljs.core.val.call(null, e__10403));
          es__10400 = G__10414;
          tcoll__10401 = G__10415;
          continue
        }else {
          return tcoll__10401
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__10404 = this;
  var tcoll__10405 = this;
  if(cljs.core.truth_(this__10404.edit)) {
    if(k == null) {
      if(this__10404.nil_val === v) {
      }else {
        this__10404.nil_val = v
      }
      if(cljs.core.truth_(this__10404.has_nil_QMARK_)) {
      }else {
        this__10404.count = this__10404.count + 1;
        this__10404.has_nil_QMARK_ = true
      }
      return tcoll__10405
    }else {
      var added_leaf_QMARK___10406 = [false];
      var node__10407 = (this__10404.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__10404.root).inode_assoc_BANG_(this__10404.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___10406);
      if(node__10407 === this__10404.root) {
      }else {
        this__10404.root = node__10407
      }
      if(cljs.core.truth_(added_leaf_QMARK___10406[0])) {
        this__10404.count = this__10404.count + 1
      }else {
      }
      return tcoll__10405
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__10408 = this;
  var tcoll__10409 = this;
  if(cljs.core.truth_(this__10408.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__10408.has_nil_QMARK_)) {
        this__10408.has_nil_QMARK_ = false;
        this__10408.nil_val = null;
        this__10408.count = this__10408.count - 1;
        return tcoll__10409
      }else {
        return tcoll__10409
      }
    }else {
      if(this__10408.root == null) {
        return tcoll__10409
      }else {
        var removed_leaf_QMARK___10410 = [false];
        var node__10411 = this__10408.root.inode_without_BANG_(this__10408.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___10410);
        if(node__10411 === this__10408.root) {
        }else {
          this__10408.root = node__10411
        }
        if(cljs.core.truth_(removed_leaf_QMARK___10410[0])) {
          this__10408.count = this__10408.count - 1
        }else {
        }
        return tcoll__10409
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__10412 = this;
  var tcoll__10413 = this;
  if(cljs.core.truth_(this__10412.edit)) {
    this__10412.edit = null;
    return new cljs.core.PersistentHashMap(null, this__10412.count, this__10412.root, this__10412.has_nil_QMARK_, this__10412.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__10416 = node;
  var stack__10417 = stack;
  while(true) {
    if(t__10416 != null) {
      var G__10418 = cljs.core.truth_(ascending_QMARK_) ? t__10416.left : t__10416.right;
      var G__10419 = cljs.core.conj.call(null, stack__10417, t__10416);
      t__10416 = G__10418;
      stack__10417 = G__10419;
      continue
    }else {
      return stack__10417
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10420 = this;
  var h__364__auto____10421 = this__10420.__hash;
  if(h__364__auto____10421 != null) {
    return h__364__auto____10421
  }else {
    var h__364__auto____10422 = cljs.core.hash_coll.call(null, coll);
    this__10420.__hash = h__364__auto____10422;
    return h__364__auto____10422
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10423 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__10424 = this;
  var this$__10425 = this;
  return cljs.core.pr_str.call(null, this$__10425)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__10426 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10427 = this;
  if(this__10427.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__10427.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__10428 = this;
  return cljs.core.peek.call(null, this__10428.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__10429 = this;
  var t__10430 = cljs.core.peek.call(null, this__10429.stack);
  var next_stack__10431 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__10429.ascending_QMARK_) ? t__10430.right : t__10430.left, cljs.core.pop.call(null, this__10429.stack), this__10429.ascending_QMARK_);
  if(next_stack__10431 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__10431, this__10429.ascending_QMARK_, this__10429.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10432 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10433 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__10433.stack, this__10433.ascending_QMARK_, this__10433.cnt, this__10433.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10434 = this;
  return this__10434.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3546__auto____10435 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____10435) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____10435
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3546__auto____10436 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____10436) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____10436
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__10437 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__10437)) {
    return cljs.core.deref.call(null, init__10437)
  }else {
    var init__10438 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__10437) : init__10437;
    if(cljs.core.reduced_QMARK_.call(null, init__10438)) {
      return cljs.core.deref.call(null, init__10438)
    }else {
      var init__10439 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__10438) : init__10438;
      if(cljs.core.reduced_QMARK_.call(null, init__10439)) {
        return cljs.core.deref.call(null, init__10439)
      }else {
        return init__10439
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10444 = this;
  var h__364__auto____10445 = this__10444.__hash;
  if(h__364__auto____10445 != null) {
    return h__364__auto____10445
  }else {
    var h__364__auto____10446 = cljs.core.hash_coll.call(null, coll);
    this__10444.__hash = h__364__auto____10446;
    return h__364__auto____10446
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10447 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10448 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10449 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10449.key, this__10449.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__10496 = null;
  var G__10496__2 = function(tsym10442, k) {
    var this__10450 = this;
    var tsym10442__10451 = this;
    var node__10452 = tsym10442__10451;
    return cljs.core._lookup.call(null, node__10452, k)
  };
  var G__10496__3 = function(tsym10443, k, not_found) {
    var this__10453 = this;
    var tsym10443__10454 = this;
    var node__10455 = tsym10443__10454;
    return cljs.core._lookup.call(null, node__10455, k, not_found)
  };
  G__10496 = function(tsym10443, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10496__2.call(this, tsym10443, k);
      case 3:
        return G__10496__3.call(this, tsym10443, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10496
}();
cljs.core.BlackNode.prototype.apply = function(tsym10440, args10441) {
  return tsym10440.call.apply(tsym10440, [tsym10440].concat(cljs.core.aclone.call(null, args10441)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10456 = this;
  return cljs.core.PersistentVector.fromArray([this__10456.key, this__10456.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10457 = this;
  return this__10457.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10458 = this;
  return this__10458.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__10459 = this;
  var node__10460 = this;
  return ins.balance_right(node__10460)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__10461 = this;
  var node__10462 = this;
  return new cljs.core.RedNode(this__10461.key, this__10461.val, this__10461.left, this__10461.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__10463 = this;
  var node__10464 = this;
  return cljs.core.balance_right_del.call(null, this__10463.key, this__10463.val, this__10463.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__10465 = this;
  var node__10466 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__10467 = this;
  var node__10468 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10468, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__10469 = this;
  var node__10470 = this;
  return cljs.core.balance_left_del.call(null, this__10469.key, this__10469.val, del, this__10469.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__10471 = this;
  var node__10472 = this;
  return ins.balance_left(node__10472)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__10473 = this;
  var node__10474 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__10474, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__10497 = null;
  var G__10497__0 = function() {
    var this__10477 = this;
    var this$__10478 = this;
    return cljs.core.pr_str.call(null, this$__10478)
  };
  G__10497 = function() {
    switch(arguments.length) {
      case 0:
        return G__10497__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10497
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__10479 = this;
  var node__10480 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10480, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__10481 = this;
  var node__10482 = this;
  return node__10482
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10483 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10484 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10485 = this;
  return cljs.core.list.call(null, this__10485.key, this__10485.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10487 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10488 = this;
  return this__10488.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10489 = this;
  return cljs.core.PersistentVector.fromArray([this__10489.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10490 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10490.key, this__10490.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10491 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10492 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10492.key, this__10492.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10493 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10494 = this;
  if(n === 0) {
    return this__10494.key
  }else {
    if(n === 1) {
      return this__10494.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__10495 = this;
  if(n === 0) {
    return this__10495.key
  }else {
    if(n === 1) {
      return this__10495.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__10486 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10502 = this;
  var h__364__auto____10503 = this__10502.__hash;
  if(h__364__auto____10503 != null) {
    return h__364__auto____10503
  }else {
    var h__364__auto____10504 = cljs.core.hash_coll.call(null, coll);
    this__10502.__hash = h__364__auto____10504;
    return h__364__auto____10504
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__10505 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__10506 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__10507 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__10507.key, this__10507.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__10554 = null;
  var G__10554__2 = function(tsym10500, k) {
    var this__10508 = this;
    var tsym10500__10509 = this;
    var node__10510 = tsym10500__10509;
    return cljs.core._lookup.call(null, node__10510, k)
  };
  var G__10554__3 = function(tsym10501, k, not_found) {
    var this__10511 = this;
    var tsym10501__10512 = this;
    var node__10513 = tsym10501__10512;
    return cljs.core._lookup.call(null, node__10513, k, not_found)
  };
  G__10554 = function(tsym10501, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10554__2.call(this, tsym10501, k);
      case 3:
        return G__10554__3.call(this, tsym10501, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10554
}();
cljs.core.RedNode.prototype.apply = function(tsym10498, args10499) {
  return tsym10498.call.apply(tsym10498, [tsym10498].concat(cljs.core.aclone.call(null, args10499)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__10514 = this;
  return cljs.core.PersistentVector.fromArray([this__10514.key, this__10514.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__10515 = this;
  return this__10515.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__10516 = this;
  return this__10516.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__10517 = this;
  var node__10518 = this;
  return new cljs.core.RedNode(this__10517.key, this__10517.val, this__10517.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__10519 = this;
  var node__10520 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__10521 = this;
  var node__10522 = this;
  return new cljs.core.RedNode(this__10521.key, this__10521.val, this__10521.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__10523 = this;
  var node__10524 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__10525 = this;
  var node__10526 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__10526, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__10527 = this;
  var node__10528 = this;
  return new cljs.core.RedNode(this__10527.key, this__10527.val, del, this__10527.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__10529 = this;
  var node__10530 = this;
  return new cljs.core.RedNode(this__10529.key, this__10529.val, ins, this__10529.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__10531 = this;
  var node__10532 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10531.left)) {
    return new cljs.core.RedNode(this__10531.key, this__10531.val, this__10531.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__10531.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10531.right)) {
      return new cljs.core.RedNode(this__10531.right.key, this__10531.right.val, new cljs.core.BlackNode(this__10531.key, this__10531.val, this__10531.left, this__10531.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__10531.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__10532, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__10555 = null;
  var G__10555__0 = function() {
    var this__10535 = this;
    var this$__10536 = this;
    return cljs.core.pr_str.call(null, this$__10536)
  };
  G__10555 = function() {
    switch(arguments.length) {
      case 0:
        return G__10555__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10555
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__10537 = this;
  var node__10538 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10537.right)) {
    return new cljs.core.RedNode(this__10537.key, this__10537.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10537.left, null), this__10537.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__10537.left)) {
      return new cljs.core.RedNode(this__10537.left.key, this__10537.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__10537.left.left, null), new cljs.core.BlackNode(this__10537.key, this__10537.val, this__10537.left.right, this__10537.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__10538, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__10539 = this;
  var node__10540 = this;
  return new cljs.core.BlackNode(this__10539.key, this__10539.val, this__10539.left, this__10539.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__10541 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__10542 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__10543 = this;
  return cljs.core.list.call(null, this__10543.key, this__10543.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__10545 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__10546 = this;
  return this__10546.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__10547 = this;
  return cljs.core.PersistentVector.fromArray([this__10547.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__10548 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__10548.key, this__10548.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10549 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__10550 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__10550.key, this__10550.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__10551 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__10552 = this;
  if(n === 0) {
    return this__10552.key
  }else {
    if(n === 1) {
      return this__10552.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__10553 = this;
  if(n === 0) {
    return this__10553.key
  }else {
    if(n === 1) {
      return this__10553.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__10544 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__10556 = comp.call(null, k, tree.key);
    if(c__10556 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__10556 < 0) {
        var ins__10557 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__10557 != null) {
          return tree.add_left(ins__10557)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__10558 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__10558 != null) {
            return tree.add_right(ins__10558)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__10559 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10559)) {
            return new cljs.core.RedNode(app__10559.key, app__10559.val, new cljs.core.RedNode(left.key, left.val, left.left, app__10559.left), new cljs.core.RedNode(right.key, right.val, app__10559.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__10559, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__10560 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__10560)) {
              return new cljs.core.RedNode(app__10560.key, app__10560.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__10560.left, null), new cljs.core.BlackNode(right.key, right.val, app__10560.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__10560, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__10561 = comp.call(null, k, tree.key);
    if(c__10561 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__10561 < 0) {
        var del__10562 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____10563 = del__10562 != null;
          if(or__3548__auto____10563) {
            return or__3548__auto____10563
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__10562, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__10562, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__10564 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____10565 = del__10564 != null;
            if(or__3548__auto____10565) {
              return or__3548__auto____10565
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__10564)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__10564, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__10566 = tree.key;
  var c__10567 = comp.call(null, k, tk__10566);
  if(c__10567 === 0) {
    return tree.replace(tk__10566, v, tree.left, tree.right)
  }else {
    if(c__10567 < 0) {
      return tree.replace(tk__10566, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__10566, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10572 = this;
  var h__364__auto____10573 = this__10572.__hash;
  if(h__364__auto____10573 != null) {
    return h__364__auto____10573
  }else {
    var h__364__auto____10574 = cljs.core.hash_imap.call(null, coll);
    this__10572.__hash = h__364__auto____10574;
    return h__364__auto____10574
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__10575 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__10576 = this;
  var n__10577 = coll.entry_at(k);
  if(n__10577 != null) {
    return n__10577.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__10578 = this;
  var found__10579 = [null];
  var t__10580 = cljs.core.tree_map_add.call(null, this__10578.comp, this__10578.tree, k, v, found__10579);
  if(t__10580 == null) {
    var found_node__10581 = cljs.core.nth.call(null, found__10579, 0);
    if(cljs.core._EQ_.call(null, v, found_node__10581.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10578.comp, cljs.core.tree_map_replace.call(null, this__10578.comp, this__10578.tree, k, v), this__10578.cnt, this__10578.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10578.comp, t__10580.blacken(), this__10578.cnt + 1, this__10578.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__10582 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__10614 = null;
  var G__10614__2 = function(tsym10570, k) {
    var this__10583 = this;
    var tsym10570__10584 = this;
    var coll__10585 = tsym10570__10584;
    return cljs.core._lookup.call(null, coll__10585, k)
  };
  var G__10614__3 = function(tsym10571, k, not_found) {
    var this__10586 = this;
    var tsym10571__10587 = this;
    var coll__10588 = tsym10571__10587;
    return cljs.core._lookup.call(null, coll__10588, k, not_found)
  };
  G__10614 = function(tsym10571, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10614__2.call(this, tsym10571, k);
      case 3:
        return G__10614__3.call(this, tsym10571, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10614
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym10568, args10569) {
  return tsym10568.call.apply(tsym10568, [tsym10568].concat(cljs.core.aclone.call(null, args10569)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__10589 = this;
  if(this__10589.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__10589.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__10590 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10591 = this;
  if(this__10591.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10591.tree, false, this__10591.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__10592 = this;
  var this$__10593 = this;
  return cljs.core.pr_str.call(null, this$__10593)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__10594 = this;
  var coll__10595 = this;
  var t__10596 = this__10594.tree;
  while(true) {
    if(t__10596 != null) {
      var c__10597 = this__10594.comp.call(null, k, t__10596.key);
      if(c__10597 === 0) {
        return t__10596
      }else {
        if(c__10597 < 0) {
          var G__10615 = t__10596.left;
          t__10596 = G__10615;
          continue
        }else {
          if("\ufdd0'else") {
            var G__10616 = t__10596.right;
            t__10596 = G__10616;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10598 = this;
  if(this__10598.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10598.tree, ascending_QMARK_, this__10598.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10599 = this;
  if(this__10599.cnt > 0) {
    var stack__10600 = null;
    var t__10601 = this__10599.tree;
    while(true) {
      if(t__10601 != null) {
        var c__10602 = this__10599.comp.call(null, k, t__10601.key);
        if(c__10602 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__10600, t__10601), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__10602 < 0) {
              var G__10617 = cljs.core.conj.call(null, stack__10600, t__10601);
              var G__10618 = t__10601.left;
              stack__10600 = G__10617;
              t__10601 = G__10618;
              continue
            }else {
              var G__10619 = stack__10600;
              var G__10620 = t__10601.right;
              stack__10600 = G__10619;
              t__10601 = G__10620;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__10602 > 0) {
                var G__10621 = cljs.core.conj.call(null, stack__10600, t__10601);
                var G__10622 = t__10601.right;
                stack__10600 = G__10621;
                t__10601 = G__10622;
                continue
              }else {
                var G__10623 = stack__10600;
                var G__10624 = t__10601.left;
                stack__10600 = G__10623;
                t__10601 = G__10624;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__10600 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__10600, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10603 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10604 = this;
  return this__10604.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10605 = this;
  if(this__10605.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__10605.tree, true, this__10605.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10606 = this;
  return this__10606.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10607 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10608 = this;
  return new cljs.core.PersistentTreeMap(this__10608.comp, this__10608.tree, this__10608.cnt, meta, this__10608.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10612 = this;
  return this__10612.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10613 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__10613.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__10609 = this;
  var found__10610 = [null];
  var t__10611 = cljs.core.tree_map_remove.call(null, this__10609.comp, this__10609.tree, k, found__10610);
  if(t__10611 == null) {
    if(cljs.core.nth.call(null, found__10610, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__10609.comp, null, 0, this__10609.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__10609.comp, t__10611.blacken(), this__10609.cnt - 1, this__10609.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__10625 = cljs.core.seq.call(null, keyvals);
    var out__10626 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__10625)) {
        var G__10627 = cljs.core.nnext.call(null, in$__10625);
        var G__10628 = cljs.core.assoc_BANG_.call(null, out__10626, cljs.core.first.call(null, in$__10625), cljs.core.second.call(null, in$__10625));
        in$__10625 = G__10627;
        out__10626 = G__10628;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__10626)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__10629) {
    var keyvals = cljs.core.seq(arglist__10629);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__10630) {
    var keyvals = cljs.core.seq(arglist__10630);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__10631 = cljs.core.seq.call(null, keyvals);
    var out__10632 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__10631)) {
        var G__10633 = cljs.core.nnext.call(null, in$__10631);
        var G__10634 = cljs.core.assoc.call(null, out__10632, cljs.core.first.call(null, in$__10631), cljs.core.second.call(null, in$__10631));
        in$__10631 = G__10633;
        out__10632 = G__10634;
        continue
      }else {
        return out__10632
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__10635) {
    var keyvals = cljs.core.seq(arglist__10635);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__10636 = cljs.core.seq.call(null, keyvals);
    var out__10637 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__10636)) {
        var G__10638 = cljs.core.nnext.call(null, in$__10636);
        var G__10639 = cljs.core.assoc.call(null, out__10637, cljs.core.first.call(null, in$__10636), cljs.core.second.call(null, in$__10636));
        in$__10636 = G__10638;
        out__10637 = G__10639;
        continue
      }else {
        return out__10637
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__10640) {
    var comparator = cljs.core.first(arglist__10640);
    var keyvals = cljs.core.rest(arglist__10640);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__10641_SHARP_, p2__10642_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____10643 = p1__10641_SHARP_;
          if(cljs.core.truth_(or__3548__auto____10643)) {
            return or__3548__auto____10643
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__10642_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__10644) {
    var maps = cljs.core.seq(arglist__10644);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__10647 = function(m, e) {
        var k__10645 = cljs.core.first.call(null, e);
        var v__10646 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__10645)) {
          return cljs.core.assoc.call(null, m, k__10645, f.call(null, cljs.core.get.call(null, m, k__10645), v__10646))
        }else {
          return cljs.core.assoc.call(null, m, k__10645, v__10646)
        }
      };
      var merge2__10649 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__10647, function() {
          var or__3548__auto____10648 = m1;
          if(cljs.core.truth_(or__3548__auto____10648)) {
            return or__3548__auto____10648
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__10649, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__10650) {
    var f = cljs.core.first(arglist__10650);
    var maps = cljs.core.rest(arglist__10650);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__10651 = cljs.core.ObjMap.fromObject([], {});
  var keys__10652 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__10652)) {
      var key__10653 = cljs.core.first.call(null, keys__10652);
      var entry__10654 = cljs.core.get.call(null, map, key__10653, "\ufdd0'user/not-found");
      var G__10655 = cljs.core.not_EQ_.call(null, entry__10654, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__10651, key__10653, entry__10654) : ret__10651;
      var G__10656 = cljs.core.next.call(null, keys__10652);
      ret__10651 = G__10655;
      keys__10652 = G__10656;
      continue
    }else {
      return ret__10651
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__10662 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__10662.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10663 = this;
  var h__364__auto____10664 = this__10663.__hash;
  if(h__364__auto____10664 != null) {
    return h__364__auto____10664
  }else {
    var h__364__auto____10665 = cljs.core.hash_iset.call(null, coll);
    this__10663.__hash = h__364__auto____10665;
    return h__364__auto____10665
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10666 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10667 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10667.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__10686 = null;
  var G__10686__2 = function(tsym10660, k) {
    var this__10668 = this;
    var tsym10660__10669 = this;
    var coll__10670 = tsym10660__10669;
    return cljs.core._lookup.call(null, coll__10670, k)
  };
  var G__10686__3 = function(tsym10661, k, not_found) {
    var this__10671 = this;
    var tsym10661__10672 = this;
    var coll__10673 = tsym10661__10672;
    return cljs.core._lookup.call(null, coll__10673, k, not_found)
  };
  G__10686 = function(tsym10661, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10686__2.call(this, tsym10661, k);
      case 3:
        return G__10686__3.call(this, tsym10661, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10686
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym10658, args10659) {
  return tsym10658.call.apply(tsym10658, [tsym10658].concat(cljs.core.aclone.call(null, args10659)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10674 = this;
  return new cljs.core.PersistentHashSet(this__10674.meta, cljs.core.assoc.call(null, this__10674.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__10675 = this;
  var this$__10676 = this;
  return cljs.core.pr_str.call(null, this$__10676)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10677 = this;
  return cljs.core.keys.call(null, this__10677.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10678 = this;
  return new cljs.core.PersistentHashSet(this__10678.meta, cljs.core.dissoc.call(null, this__10678.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10679 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10680 = this;
  var and__3546__auto____10681 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____10681) {
    var and__3546__auto____10682 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____10682) {
      return cljs.core.every_QMARK_.call(null, function(p1__10657_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10657_SHARP_)
      }, other)
    }else {
      return and__3546__auto____10682
    }
  }else {
    return and__3546__auto____10681
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10683 = this;
  return new cljs.core.PersistentHashSet(meta, this__10683.hash_map, this__10683.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10684 = this;
  return this__10684.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10685 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__10685.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__10704 = null;
  var G__10704__2 = function(tsym10690, k) {
    var this__10692 = this;
    var tsym10690__10693 = this;
    var tcoll__10694 = tsym10690__10693;
    if(cljs.core._lookup.call(null, this__10692.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__10704__3 = function(tsym10691, k, not_found) {
    var this__10695 = this;
    var tsym10691__10696 = this;
    var tcoll__10697 = tsym10691__10696;
    if(cljs.core._lookup.call(null, this__10695.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__10704 = function(tsym10691, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10704__2.call(this, tsym10691, k);
      case 3:
        return G__10704__3.call(this, tsym10691, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10704
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym10688, args10689) {
  return tsym10688.call.apply(tsym10688, [tsym10688].concat(cljs.core.aclone.call(null, args10689)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__10698 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__10699 = this;
  if(cljs.core._lookup.call(null, this__10699.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__10700 = this;
  return cljs.core.count.call(null, this__10700.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__10701 = this;
  this__10701.transient_map = cljs.core.dissoc_BANG_.call(null, this__10701.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__10702 = this;
  this__10702.transient_map = cljs.core.assoc_BANG_.call(null, this__10702.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__10703 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__10703.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__10709 = this;
  var h__364__auto____10710 = this__10709.__hash;
  if(h__364__auto____10710 != null) {
    return h__364__auto____10710
  }else {
    var h__364__auto____10711 = cljs.core.hash_iset.call(null, coll);
    this__10709.__hash = h__364__auto____10711;
    return h__364__auto____10711
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__10712 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__10713 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__10713.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__10737 = null;
  var G__10737__2 = function(tsym10707, k) {
    var this__10714 = this;
    var tsym10707__10715 = this;
    var coll__10716 = tsym10707__10715;
    return cljs.core._lookup.call(null, coll__10716, k)
  };
  var G__10737__3 = function(tsym10708, k, not_found) {
    var this__10717 = this;
    var tsym10708__10718 = this;
    var coll__10719 = tsym10708__10718;
    return cljs.core._lookup.call(null, coll__10719, k, not_found)
  };
  G__10737 = function(tsym10708, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10737__2.call(this, tsym10708, k);
      case 3:
        return G__10737__3.call(this, tsym10708, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10737
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym10705, args10706) {
  return tsym10705.call.apply(tsym10705, [tsym10705].concat(cljs.core.aclone.call(null, args10706)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__10720 = this;
  return new cljs.core.PersistentTreeSet(this__10720.meta, cljs.core.assoc.call(null, this__10720.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__10721 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__10721.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__10722 = this;
  var this$__10723 = this;
  return cljs.core.pr_str.call(null, this$__10723)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__10724 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__10724.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__10725 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__10725.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__10726 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__10727 = this;
  return cljs.core._comparator.call(null, this__10727.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__10728 = this;
  return cljs.core.keys.call(null, this__10728.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__10729 = this;
  return new cljs.core.PersistentTreeSet(this__10729.meta, cljs.core.dissoc.call(null, this__10729.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__10730 = this;
  return cljs.core.count.call(null, this__10730.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__10731 = this;
  var and__3546__auto____10732 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____10732) {
    var and__3546__auto____10733 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____10733) {
      return cljs.core.every_QMARK_.call(null, function(p1__10687_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__10687_SHARP_)
      }, other)
    }else {
      return and__3546__auto____10733
    }
  }else {
    return and__3546__auto____10732
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__10734 = this;
  return new cljs.core.PersistentTreeSet(meta, this__10734.tree_map, this__10734.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__10735 = this;
  return this__10735.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__10736 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__10736.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__10738 = cljs.core.seq.call(null, coll);
  var out__10739 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__10738))) {
      var G__10740 = cljs.core.next.call(null, in$__10738);
      var G__10741 = cljs.core.conj_BANG_.call(null, out__10739, cljs.core.first.call(null, in$__10738));
      in$__10738 = G__10740;
      out__10739 = G__10741;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__10739)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__10742) {
    var keys = cljs.core.seq(arglist__10742);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__10744) {
    var comparator = cljs.core.first(arglist__10744);
    var keys = cljs.core.rest(arglist__10744);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__10745 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____10746 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____10746)) {
        var e__10747 = temp__3695__auto____10746;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__10747))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__10745, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__10743_SHARP_) {
      var temp__3695__auto____10748 = cljs.core.find.call(null, smap, p1__10743_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____10748)) {
        var e__10749 = temp__3695__auto____10748;
        return cljs.core.second.call(null, e__10749)
      }else {
        return p1__10743_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__10757 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__10750, seen) {
        while(true) {
          var vec__10751__10752 = p__10750;
          var f__10753 = cljs.core.nth.call(null, vec__10751__10752, 0, null);
          var xs__10754 = vec__10751__10752;
          var temp__3698__auto____10755 = cljs.core.seq.call(null, xs__10754);
          if(cljs.core.truth_(temp__3698__auto____10755)) {
            var s__10756 = temp__3698__auto____10755;
            if(cljs.core.contains_QMARK_.call(null, seen, f__10753)) {
              var G__10758 = cljs.core.rest.call(null, s__10756);
              var G__10759 = seen;
              p__10750 = G__10758;
              seen = G__10759;
              continue
            }else {
              return cljs.core.cons.call(null, f__10753, step.call(null, cljs.core.rest.call(null, s__10756), cljs.core.conj.call(null, seen, f__10753)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__10757.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__10760 = cljs.core.PersistentVector.fromArray([]);
  var s__10761 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__10761))) {
      var G__10762 = cljs.core.conj.call(null, ret__10760, cljs.core.first.call(null, s__10761));
      var G__10763 = cljs.core.next.call(null, s__10761);
      ret__10760 = G__10762;
      s__10761 = G__10763;
      continue
    }else {
      return cljs.core.seq.call(null, ret__10760)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____10764 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____10764) {
        return or__3548__auto____10764
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__10765 = x.lastIndexOf("/");
      if(i__10765 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__10765 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3548__auto____10766 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____10766) {
      return or__3548__auto____10766
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__10767 = x.lastIndexOf("/");
    if(i__10767 > -1) {
      return cljs.core.subs.call(null, x, 2, i__10767)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__10770 = cljs.core.ObjMap.fromObject([], {});
  var ks__10771 = cljs.core.seq.call(null, keys);
  var vs__10772 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10773 = ks__10771;
      if(cljs.core.truth_(and__3546__auto____10773)) {
        return vs__10772
      }else {
        return and__3546__auto____10773
      }
    }())) {
      var G__10774 = cljs.core.assoc.call(null, map__10770, cljs.core.first.call(null, ks__10771), cljs.core.first.call(null, vs__10772));
      var G__10775 = cljs.core.next.call(null, ks__10771);
      var G__10776 = cljs.core.next.call(null, vs__10772);
      map__10770 = G__10774;
      ks__10771 = G__10775;
      vs__10772 = G__10776;
      continue
    }else {
      return map__10770
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__10779__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10768_SHARP_, p2__10769_SHARP_) {
        return max_key.call(null, k, p1__10768_SHARP_, p2__10769_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__10779 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10779__delegate.call(this, k, x, y, more)
    };
    G__10779.cljs$lang$maxFixedArity = 3;
    G__10779.cljs$lang$applyTo = function(arglist__10780) {
      var k = cljs.core.first(arglist__10780);
      var x = cljs.core.first(cljs.core.next(arglist__10780));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10780)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10780)));
      return G__10779__delegate(k, x, y, more)
    };
    G__10779.cljs$lang$arity$variadic = G__10779__delegate;
    return G__10779
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__10781__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__10777_SHARP_, p2__10778_SHARP_) {
        return min_key.call(null, k, p1__10777_SHARP_, p2__10778_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__10781 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10781__delegate.call(this, k, x, y, more)
    };
    G__10781.cljs$lang$maxFixedArity = 3;
    G__10781.cljs$lang$applyTo = function(arglist__10782) {
      var k = cljs.core.first(arglist__10782);
      var x = cljs.core.first(cljs.core.next(arglist__10782));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10782)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10782)));
      return G__10781__delegate(k, x, y, more)
    };
    G__10781.cljs$lang$arity$variadic = G__10781__delegate;
    return G__10781
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10783 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10783)) {
        var s__10784 = temp__3698__auto____10783;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__10784), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__10784)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10785 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10785)) {
      var s__10786 = temp__3698__auto____10785;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__10786)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10786), take_while.call(null, pred, cljs.core.rest.call(null, s__10786)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__10787 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__10787.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__10788 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____10789 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____10789)) {
        var vec__10790__10791 = temp__3698__auto____10789;
        var e__10792 = cljs.core.nth.call(null, vec__10790__10791, 0, null);
        var s__10793 = vec__10790__10791;
        if(cljs.core.truth_(include__10788.call(null, e__10792))) {
          return s__10793
        }else {
          return cljs.core.next.call(null, s__10793)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10788, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____10794 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____10794)) {
      var vec__10795__10796 = temp__3698__auto____10794;
      var e__10797 = cljs.core.nth.call(null, vec__10795__10796, 0, null);
      var s__10798 = vec__10795__10796;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__10797)) ? s__10798 : cljs.core.next.call(null, s__10798))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__10799 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____10800 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____10800)) {
        var vec__10801__10802 = temp__3698__auto____10800;
        var e__10803 = cljs.core.nth.call(null, vec__10801__10802, 0, null);
        var s__10804 = vec__10801__10802;
        if(cljs.core.truth_(include__10799.call(null, e__10803))) {
          return s__10804
        }else {
          return cljs.core.next.call(null, s__10804)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__10799, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____10805 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____10805)) {
      var vec__10806__10807 = temp__3698__auto____10805;
      var e__10808 = cljs.core.nth.call(null, vec__10806__10807, 0, null);
      var s__10809 = vec__10806__10807;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__10808)) ? s__10809 : cljs.core.next.call(null, s__10809))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__10810 = this;
  var h__364__auto____10811 = this__10810.__hash;
  if(h__364__auto____10811 != null) {
    return h__364__auto____10811
  }else {
    var h__364__auto____10812 = cljs.core.hash_coll.call(null, rng);
    this__10810.__hash = h__364__auto____10812;
    return h__364__auto____10812
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__10813 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__10814 = this;
  var this$__10815 = this;
  return cljs.core.pr_str.call(null, this$__10815)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__10816 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__10817 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__10818 = this;
  var comp__10819 = this__10818.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__10819.call(null, this__10818.start, this__10818.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__10820 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__10820.end - this__10820.start) / this__10820.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__10821 = this;
  return this__10821.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__10822 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__10822.meta, this__10822.start + this__10822.step, this__10822.end, this__10822.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__10823 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__10824 = this;
  return new cljs.core.Range(meta, this__10824.start, this__10824.end, this__10824.step, this__10824.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__10825 = this;
  return this__10825.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__10826 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__10826.start + n * this__10826.step
  }else {
    if(function() {
      var and__3546__auto____10827 = this__10826.start > this__10826.end;
      if(and__3546__auto____10827) {
        return this__10826.step === 0
      }else {
        return and__3546__auto____10827
      }
    }()) {
      return this__10826.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__10828 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__10828.start + n * this__10828.step
  }else {
    if(function() {
      var and__3546__auto____10829 = this__10828.start > this__10828.end;
      if(and__3546__auto____10829) {
        return this__10828.step === 0
      }else {
        return and__3546__auto____10829
      }
    }()) {
      return this__10828.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__10830 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10830.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10831 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10831)) {
      var s__10832 = temp__3698__auto____10831;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__10832), take_nth.call(null, n, cljs.core.drop.call(null, n, s__10832)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10834 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10834)) {
      var s__10835 = temp__3698__auto____10834;
      var fst__10836 = cljs.core.first.call(null, s__10835);
      var fv__10837 = f.call(null, fst__10836);
      var run__10838 = cljs.core.cons.call(null, fst__10836, cljs.core.take_while.call(null, function(p1__10833_SHARP_) {
        return cljs.core._EQ_.call(null, fv__10837, f.call(null, p1__10833_SHARP_))
      }, cljs.core.next.call(null, s__10835)));
      return cljs.core.cons.call(null, run__10838, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__10838), s__10835))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____10849 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____10849)) {
        var s__10850 = temp__3695__auto____10849;
        return reductions.call(null, f, cljs.core.first.call(null, s__10850), cljs.core.rest.call(null, s__10850))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10851 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10851)) {
        var s__10852 = temp__3698__auto____10851;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__10852)), cljs.core.rest.call(null, s__10852))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__10854 = null;
      var G__10854__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__10854__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__10854__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__10854__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__10854__4 = function() {
        var G__10855__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__10855 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10855__delegate.call(this, x, y, z, args)
        };
        G__10855.cljs$lang$maxFixedArity = 3;
        G__10855.cljs$lang$applyTo = function(arglist__10856) {
          var x = cljs.core.first(arglist__10856);
          var y = cljs.core.first(cljs.core.next(arglist__10856));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10856)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10856)));
          return G__10855__delegate(x, y, z, args)
        };
        G__10855.cljs$lang$arity$variadic = G__10855__delegate;
        return G__10855
      }();
      G__10854 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10854__0.call(this);
          case 1:
            return G__10854__1.call(this, x);
          case 2:
            return G__10854__2.call(this, x, y);
          case 3:
            return G__10854__3.call(this, x, y, z);
          default:
            return G__10854__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10854.cljs$lang$maxFixedArity = 3;
      G__10854.cljs$lang$applyTo = G__10854__4.cljs$lang$applyTo;
      return G__10854
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__10857 = null;
      var G__10857__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__10857__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__10857__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__10857__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__10857__4 = function() {
        var G__10858__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10858 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10858__delegate.call(this, x, y, z, args)
        };
        G__10858.cljs$lang$maxFixedArity = 3;
        G__10858.cljs$lang$applyTo = function(arglist__10859) {
          var x = cljs.core.first(arglist__10859);
          var y = cljs.core.first(cljs.core.next(arglist__10859));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10859)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10859)));
          return G__10858__delegate(x, y, z, args)
        };
        G__10858.cljs$lang$arity$variadic = G__10858__delegate;
        return G__10858
      }();
      G__10857 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10857__0.call(this);
          case 1:
            return G__10857__1.call(this, x);
          case 2:
            return G__10857__2.call(this, x, y);
          case 3:
            return G__10857__3.call(this, x, y, z);
          default:
            return G__10857__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10857.cljs$lang$maxFixedArity = 3;
      G__10857.cljs$lang$applyTo = G__10857__4.cljs$lang$applyTo;
      return G__10857
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__10860 = null;
      var G__10860__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__10860__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__10860__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__10860__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__10860__4 = function() {
        var G__10861__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__10861 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10861__delegate.call(this, x, y, z, args)
        };
        G__10861.cljs$lang$maxFixedArity = 3;
        G__10861.cljs$lang$applyTo = function(arglist__10862) {
          var x = cljs.core.first(arglist__10862);
          var y = cljs.core.first(cljs.core.next(arglist__10862));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10862)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10862)));
          return G__10861__delegate(x, y, z, args)
        };
        G__10861.cljs$lang$arity$variadic = G__10861__delegate;
        return G__10861
      }();
      G__10860 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10860__0.call(this);
          case 1:
            return G__10860__1.call(this, x);
          case 2:
            return G__10860__2.call(this, x, y);
          case 3:
            return G__10860__3.call(this, x, y, z);
          default:
            return G__10860__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10860.cljs$lang$maxFixedArity = 3;
      G__10860.cljs$lang$applyTo = G__10860__4.cljs$lang$applyTo;
      return G__10860
    }()
  };
  var juxt__4 = function() {
    var G__10863__delegate = function(f, g, h, fs) {
      var fs__10853 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__10864 = null;
        var G__10864__0 = function() {
          return cljs.core.reduce.call(null, function(p1__10839_SHARP_, p2__10840_SHARP_) {
            return cljs.core.conj.call(null, p1__10839_SHARP_, p2__10840_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__10853)
        };
        var G__10864__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__10841_SHARP_, p2__10842_SHARP_) {
            return cljs.core.conj.call(null, p1__10841_SHARP_, p2__10842_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__10853)
        };
        var G__10864__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__10843_SHARP_, p2__10844_SHARP_) {
            return cljs.core.conj.call(null, p1__10843_SHARP_, p2__10844_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__10853)
        };
        var G__10864__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__10845_SHARP_, p2__10846_SHARP_) {
            return cljs.core.conj.call(null, p1__10845_SHARP_, p2__10846_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__10853)
        };
        var G__10864__4 = function() {
          var G__10865__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__10847_SHARP_, p2__10848_SHARP_) {
              return cljs.core.conj.call(null, p1__10847_SHARP_, cljs.core.apply.call(null, p2__10848_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__10853)
          };
          var G__10865 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10865__delegate.call(this, x, y, z, args)
          };
          G__10865.cljs$lang$maxFixedArity = 3;
          G__10865.cljs$lang$applyTo = function(arglist__10866) {
            var x = cljs.core.first(arglist__10866);
            var y = cljs.core.first(cljs.core.next(arglist__10866));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10866)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10866)));
            return G__10865__delegate(x, y, z, args)
          };
          G__10865.cljs$lang$arity$variadic = G__10865__delegate;
          return G__10865
        }();
        G__10864 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__10864__0.call(this);
            case 1:
              return G__10864__1.call(this, x);
            case 2:
              return G__10864__2.call(this, x, y);
            case 3:
              return G__10864__3.call(this, x, y, z);
            default:
              return G__10864__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__10864.cljs$lang$maxFixedArity = 3;
        G__10864.cljs$lang$applyTo = G__10864__4.cljs$lang$applyTo;
        return G__10864
      }()
    };
    var G__10863 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10863__delegate.call(this, f, g, h, fs)
    };
    G__10863.cljs$lang$maxFixedArity = 3;
    G__10863.cljs$lang$applyTo = function(arglist__10867) {
      var f = cljs.core.first(arglist__10867);
      var g = cljs.core.first(cljs.core.next(arglist__10867));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10867)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10867)));
      return G__10863__delegate(f, g, h, fs)
    };
    G__10863.cljs$lang$arity$variadic = G__10863__delegate;
    return G__10863
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__10869 = cljs.core.next.call(null, coll);
        coll = G__10869;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____10868 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____10868)) {
          return n > 0
        }else {
          return and__3546__auto____10868
        }
      }())) {
        var G__10870 = n - 1;
        var G__10871 = cljs.core.next.call(null, coll);
        n = G__10870;
        coll = G__10871;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__10872 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__10872), s)) {
    if(cljs.core.count.call(null, matches__10872) === 1) {
      return cljs.core.first.call(null, matches__10872)
    }else {
      return cljs.core.vec.call(null, matches__10872)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__10873 = re.exec(s);
  if(matches__10873 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__10873) === 1) {
      return cljs.core.first.call(null, matches__10873)
    }else {
      return cljs.core.vec.call(null, matches__10873)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__10874 = cljs.core.re_find.call(null, re, s);
  var match_idx__10875 = s.search(re);
  var match_str__10876 = cljs.core.coll_QMARK_.call(null, match_data__10874) ? cljs.core.first.call(null, match_data__10874) : match_data__10874;
  var post_match__10877 = cljs.core.subs.call(null, s, match_idx__10875 + cljs.core.count.call(null, match_str__10876));
  if(cljs.core.truth_(match_data__10874)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__10874, re_seq.call(null, re, post_match__10877))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__10879__10880 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___10881 = cljs.core.nth.call(null, vec__10879__10880, 0, null);
  var flags__10882 = cljs.core.nth.call(null, vec__10879__10880, 1, null);
  var pattern__10883 = cljs.core.nth.call(null, vec__10879__10880, 2, null);
  return new RegExp(pattern__10883, flags__10882)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__10878_SHARP_) {
    return print_one.call(null, p1__10878_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____10884 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____10884)) {
            var and__3546__auto____10888 = function() {
              var G__10885__10886 = obj;
              if(G__10885__10886 != null) {
                if(function() {
                  var or__3548__auto____10887 = G__10885__10886.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____10887) {
                    return or__3548__auto____10887
                  }else {
                    return G__10885__10886.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__10885__10886.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10885__10886)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__10885__10886)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____10888)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____10888
            }
          }else {
            return and__3546__auto____10884
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____10889 = obj != null;
          if(and__3546__auto____10889) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____10889
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__10890__10891 = obj;
          if(G__10890__10891 != null) {
            if(function() {
              var or__3548__auto____10892 = G__10890__10891.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____10892) {
                return or__3548__auto____10892
              }else {
                return G__10890__10891.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__10890__10891.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10890__10891)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__10890__10891)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__10893 = cljs.core.first.call(null, objs);
  var sb__10894 = new goog.string.StringBuffer;
  var G__10895__10896 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__10895__10896)) {
    var obj__10897 = cljs.core.first.call(null, G__10895__10896);
    var G__10895__10898 = G__10895__10896;
    while(true) {
      if(obj__10897 === first_obj__10893) {
      }else {
        sb__10894.append(" ")
      }
      var G__10899__10900 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10897, opts));
      if(cljs.core.truth_(G__10899__10900)) {
        var string__10901 = cljs.core.first.call(null, G__10899__10900);
        var G__10899__10902 = G__10899__10900;
        while(true) {
          sb__10894.append(string__10901);
          var temp__3698__auto____10903 = cljs.core.next.call(null, G__10899__10902);
          if(cljs.core.truth_(temp__3698__auto____10903)) {
            var G__10899__10904 = temp__3698__auto____10903;
            var G__10907 = cljs.core.first.call(null, G__10899__10904);
            var G__10908 = G__10899__10904;
            string__10901 = G__10907;
            G__10899__10902 = G__10908;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____10905 = cljs.core.next.call(null, G__10895__10898);
      if(cljs.core.truth_(temp__3698__auto____10905)) {
        var G__10895__10906 = temp__3698__auto____10905;
        var G__10909 = cljs.core.first.call(null, G__10895__10906);
        var G__10910 = G__10895__10906;
        obj__10897 = G__10909;
        G__10895__10898 = G__10910;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__10894
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__10911 = cljs.core.pr_sb.call(null, objs, opts);
  sb__10911.append("\n");
  return[cljs.core.str(sb__10911)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__10912 = cljs.core.first.call(null, objs);
  var G__10913__10914 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__10913__10914)) {
    var obj__10915 = cljs.core.first.call(null, G__10913__10914);
    var G__10913__10916 = G__10913__10914;
    while(true) {
      if(obj__10915 === first_obj__10912) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__10917__10918 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__10915, opts));
      if(cljs.core.truth_(G__10917__10918)) {
        var string__10919 = cljs.core.first.call(null, G__10917__10918);
        var G__10917__10920 = G__10917__10918;
        while(true) {
          cljs.core.string_print.call(null, string__10919);
          var temp__3698__auto____10921 = cljs.core.next.call(null, G__10917__10920);
          if(cljs.core.truth_(temp__3698__auto____10921)) {
            var G__10917__10922 = temp__3698__auto____10921;
            var G__10925 = cljs.core.first.call(null, G__10917__10922);
            var G__10926 = G__10917__10922;
            string__10919 = G__10925;
            G__10917__10920 = G__10926;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____10923 = cljs.core.next.call(null, G__10913__10916);
      if(cljs.core.truth_(temp__3698__auto____10923)) {
        var G__10913__10924 = temp__3698__auto____10923;
        var G__10927 = cljs.core.first.call(null, G__10913__10924);
        var G__10928 = G__10913__10924;
        obj__10915 = G__10927;
        G__10913__10916 = G__10928;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__10929) {
    var objs = cljs.core.seq(arglist__10929);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__10930) {
    var objs = cljs.core.seq(arglist__10930);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__10931) {
    var objs = cljs.core.seq(arglist__10931);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__10932) {
    var objs = cljs.core.seq(arglist__10932);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__10933) {
    var objs = cljs.core.seq(arglist__10933);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__10934) {
    var objs = cljs.core.seq(arglist__10934);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__10935) {
    var objs = cljs.core.seq(arglist__10935);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__10936) {
    var objs = cljs.core.seq(arglist__10936);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10937 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10937, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10938 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10938, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10939 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10939, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3698__auto____10940 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____10940)) {
        var nspc__10941 = temp__3698__auto____10940;
        return[cljs.core.str(nspc__10941), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____10942 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____10942)) {
          var nspc__10943 = temp__3698__auto____10942;
          return[cljs.core.str(nspc__10943), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10944 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10944, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__10945 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__10945, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10946 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__10947 = this;
  var G__10948__10949 = cljs.core.seq.call(null, this__10947.watches);
  if(cljs.core.truth_(G__10948__10949)) {
    var G__10951__10953 = cljs.core.first.call(null, G__10948__10949);
    var vec__10952__10954 = G__10951__10953;
    var key__10955 = cljs.core.nth.call(null, vec__10952__10954, 0, null);
    var f__10956 = cljs.core.nth.call(null, vec__10952__10954, 1, null);
    var G__10948__10957 = G__10948__10949;
    var G__10951__10958 = G__10951__10953;
    var G__10948__10959 = G__10948__10957;
    while(true) {
      var vec__10960__10961 = G__10951__10958;
      var key__10962 = cljs.core.nth.call(null, vec__10960__10961, 0, null);
      var f__10963 = cljs.core.nth.call(null, vec__10960__10961, 1, null);
      var G__10948__10964 = G__10948__10959;
      f__10963.call(null, key__10962, this$, oldval, newval);
      var temp__3698__auto____10965 = cljs.core.next.call(null, G__10948__10964);
      if(cljs.core.truth_(temp__3698__auto____10965)) {
        var G__10948__10966 = temp__3698__auto____10965;
        var G__10973 = cljs.core.first.call(null, G__10948__10966);
        var G__10974 = G__10948__10966;
        G__10951__10958 = G__10973;
        G__10948__10959 = G__10974;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__10967 = this;
  return this$.watches = cljs.core.assoc.call(null, this__10967.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__10968 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__10968.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__10969 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__10969.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__10970 = this;
  return this__10970.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10971 = this;
  return this__10971.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__10972 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__10981__delegate = function(x, p__10975) {
      var map__10976__10977 = p__10975;
      var map__10976__10978 = cljs.core.seq_QMARK_.call(null, map__10976__10977) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10976__10977) : map__10976__10977;
      var validator__10979 = cljs.core.get.call(null, map__10976__10978, "\ufdd0'validator");
      var meta__10980 = cljs.core.get.call(null, map__10976__10978, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__10980, validator__10979, null)
    };
    var G__10981 = function(x, var_args) {
      var p__10975 = null;
      if(goog.isDef(var_args)) {
        p__10975 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10981__delegate.call(this, x, p__10975)
    };
    G__10981.cljs$lang$maxFixedArity = 1;
    G__10981.cljs$lang$applyTo = function(arglist__10982) {
      var x = cljs.core.first(arglist__10982);
      var p__10975 = cljs.core.rest(arglist__10982);
      return G__10981__delegate(x, p__10975)
    };
    G__10981.cljs$lang$arity$variadic = G__10981__delegate;
    return G__10981
  }();
  atom = function(x, var_args) {
    var p__10975 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____10983 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____10983)) {
    var validate__10984 = temp__3698__auto____10983;
    if(cljs.core.truth_(validate__10984.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__10985 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__10985, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__10986__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__10986 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10986__delegate.call(this, a, f, x, y, z, more)
    };
    G__10986.cljs$lang$maxFixedArity = 5;
    G__10986.cljs$lang$applyTo = function(arglist__10987) {
      var a = cljs.core.first(arglist__10987);
      var f = cljs.core.first(cljs.core.next(arglist__10987));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10987)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10987))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10987)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10987)))));
      return G__10986__delegate(a, f, x, y, z, more)
    };
    G__10986.cljs$lang$arity$variadic = G__10986__delegate;
    return G__10986
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__10988) {
    var iref = cljs.core.first(arglist__10988);
    var f = cljs.core.first(cljs.core.next(arglist__10988));
    var args = cljs.core.rest(cljs.core.next(arglist__10988));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__10989 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__10989.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__10990 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__10990.state, function(p__10991) {
    var curr_state__10992 = p__10991;
    var curr_state__10993 = cljs.core.seq_QMARK_.call(null, curr_state__10992) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__10992) : curr_state__10992;
    var done__10994 = cljs.core.get.call(null, curr_state__10993, "\ufdd0'done");
    if(cljs.core.truth_(done__10994)) {
      return curr_state__10993
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__10990.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__10995__10996 = options;
    var map__10995__10997 = cljs.core.seq_QMARK_.call(null, map__10995__10996) ? cljs.core.apply.call(null, cljs.core.hash_map, map__10995__10996) : map__10995__10996;
    var keywordize_keys__10998 = cljs.core.get.call(null, map__10995__10997, "\ufdd0'keywordize-keys");
    var keyfn__10999 = cljs.core.truth_(keywordize_keys__10998) ? cljs.core.keyword : cljs.core.str;
    var f__11005 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____11004 = function iter__11000(s__11001) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__11001__11002 = s__11001;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__11001__11002))) {
                        var k__11003 = cljs.core.first.call(null, s__11001__11002);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__10999.call(null, k__11003), thisfn.call(null, x[k__11003])]), iter__11000.call(null, cljs.core.rest.call(null, s__11001__11002)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____11004.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__11005.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__11006) {
    var x = cljs.core.first(arglist__11006);
    var options = cljs.core.rest(arglist__11006);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__11007 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__11011__delegate = function(args) {
      var temp__3695__auto____11008 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__11007), args);
      if(cljs.core.truth_(temp__3695__auto____11008)) {
        var v__11009 = temp__3695__auto____11008;
        return v__11009
      }else {
        var ret__11010 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__11007, cljs.core.assoc, args, ret__11010);
        return ret__11010
      }
    };
    var G__11011 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11011__delegate.call(this, args)
    };
    G__11011.cljs$lang$maxFixedArity = 0;
    G__11011.cljs$lang$applyTo = function(arglist__11012) {
      var args = cljs.core.seq(arglist__11012);
      return G__11011__delegate(args)
    };
    G__11011.cljs$lang$arity$variadic = G__11011__delegate;
    return G__11011
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__11013 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__11013)) {
        var G__11014 = ret__11013;
        f = G__11014;
        continue
      }else {
        return ret__11013
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__11015__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__11015 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11015__delegate.call(this, f, args)
    };
    G__11015.cljs$lang$maxFixedArity = 1;
    G__11015.cljs$lang$applyTo = function(arglist__11016) {
      var f = cljs.core.first(arglist__11016);
      var args = cljs.core.rest(arglist__11016);
      return G__11015__delegate(f, args)
    };
    G__11015.cljs$lang$arity$variadic = G__11015__delegate;
    return G__11015
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__11017 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__11017, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__11017, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3548__auto____11018 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____11018) {
      return or__3548__auto____11018
    }else {
      var or__3548__auto____11019 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____11019) {
        return or__3548__auto____11019
      }else {
        var and__3546__auto____11020 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____11020) {
          var and__3546__auto____11021 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____11021) {
            var and__3546__auto____11022 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____11022) {
              var ret__11023 = true;
              var i__11024 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____11025 = cljs.core.not.call(null, ret__11023);
                  if(or__3548__auto____11025) {
                    return or__3548__auto____11025
                  }else {
                    return i__11024 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__11023
                }else {
                  var G__11026 = isa_QMARK_.call(null, h, child.call(null, i__11024), parent.call(null, i__11024));
                  var G__11027 = i__11024 + 1;
                  ret__11023 = G__11026;
                  i__11024 = G__11027;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____11022
            }
          }else {
            return and__3546__auto____11021
          }
        }else {
          return and__3546__auto____11020
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__11031 = "\ufdd0'parents".call(null, h);
    var td__11032 = "\ufdd0'descendants".call(null, h);
    var ta__11033 = "\ufdd0'ancestors".call(null, h);
    var tf__11034 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____11035 = cljs.core.contains_QMARK_.call(null, tp__11031.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__11033.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__11033.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__11031, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__11034.call(null, "\ufdd0'ancestors".call(null, h), tag, td__11032, parent, ta__11033), "\ufdd0'descendants":tf__11034.call(null, "\ufdd0'descendants".call(null, h), parent, ta__11033, tag, td__11032)})
    }();
    if(cljs.core.truth_(or__3548__auto____11035)) {
      return or__3548__auto____11035
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__11036 = "\ufdd0'parents".call(null, h);
    var childsParents__11037 = cljs.core.truth_(parentMap__11036.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11036.call(null, tag), parent) : cljs.core.set([]);
    var newParents__11038 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11037)) ? cljs.core.assoc.call(null, parentMap__11036, tag, childsParents__11037) : cljs.core.dissoc.call(null, parentMap__11036, tag);
    var deriv_seq__11039 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__11028_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__11028_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__11028_SHARP_), cljs.core.second.call(null, p1__11028_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11038)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__11036.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__11029_SHARP_, p2__11030_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__11029_SHARP_, p2__11030_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11039))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__11040 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____11042 = cljs.core.truth_(function() {
    var and__3546__auto____11041 = xprefs__11040;
    if(cljs.core.truth_(and__3546__auto____11041)) {
      return xprefs__11040.call(null, y)
    }else {
      return and__3546__auto____11041
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____11042)) {
    return or__3548__auto____11042
  }else {
    var or__3548__auto____11044 = function() {
      var ps__11043 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__11043) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11043), prefer_table))) {
          }else {
          }
          var G__11047 = cljs.core.rest.call(null, ps__11043);
          ps__11043 = G__11047;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____11044)) {
      return or__3548__auto____11044
    }else {
      var or__3548__auto____11046 = function() {
        var ps__11045 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__11045) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11045), y, prefer_table))) {
            }else {
            }
            var G__11048 = cljs.core.rest.call(null, ps__11045);
            ps__11045 = G__11048;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____11046)) {
        return or__3548__auto____11046
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____11049 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____11049)) {
    return or__3548__auto____11049
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11058 = cljs.core.reduce.call(null, function(be, p__11050) {
    var vec__11051__11052 = p__11050;
    var k__11053 = cljs.core.nth.call(null, vec__11051__11052, 0, null);
    var ___11054 = cljs.core.nth.call(null, vec__11051__11052, 1, null);
    var e__11055 = vec__11051__11052;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11053)) {
      var be2__11057 = cljs.core.truth_(function() {
        var or__3548__auto____11056 = be == null;
        if(or__3548__auto____11056) {
          return or__3548__auto____11056
        }else {
          return cljs.core.dominates.call(null, k__11053, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11055 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11057), k__11053, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__11053), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__11057)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__11057
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11058)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11058));
      return cljs.core.second.call(null, best_entry__11058)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3546__auto____11059 = mf;
    if(and__3546__auto____11059) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____11059
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____11060 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11060) {
        return or__3548__auto____11060
      }else {
        var or__3548__auto____11061 = cljs.core._reset["_"];
        if(or__3548__auto____11061) {
          return or__3548__auto____11061
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____11062 = mf;
    if(and__3546__auto____11062) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____11062
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____11063 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11063) {
        return or__3548__auto____11063
      }else {
        var or__3548__auto____11064 = cljs.core._add_method["_"];
        if(or__3548__auto____11064) {
          return or__3548__auto____11064
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____11065 = mf;
    if(and__3546__auto____11065) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____11065
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____11066 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11066) {
        return or__3548__auto____11066
      }else {
        var or__3548__auto____11067 = cljs.core._remove_method["_"];
        if(or__3548__auto____11067) {
          return or__3548__auto____11067
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____11068 = mf;
    if(and__3546__auto____11068) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____11068
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____11069 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11069) {
        return or__3548__auto____11069
      }else {
        var or__3548__auto____11070 = cljs.core._prefer_method["_"];
        if(or__3548__auto____11070) {
          return or__3548__auto____11070
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____11071 = mf;
    if(and__3546__auto____11071) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____11071
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____11072 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11072) {
        return or__3548__auto____11072
      }else {
        var or__3548__auto____11073 = cljs.core._get_method["_"];
        if(or__3548__auto____11073) {
          return or__3548__auto____11073
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____11074 = mf;
    if(and__3546__auto____11074) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____11074
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____11075 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11075) {
        return or__3548__auto____11075
      }else {
        var or__3548__auto____11076 = cljs.core._methods["_"];
        if(or__3548__auto____11076) {
          return or__3548__auto____11076
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____11077 = mf;
    if(and__3546__auto____11077) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____11077
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____11078 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11078) {
        return or__3548__auto____11078
      }else {
        var or__3548__auto____11079 = cljs.core._prefers["_"];
        if(or__3548__auto____11079) {
          return or__3548__auto____11079
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____11080 = mf;
    if(and__3546__auto____11080) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____11080
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____11081 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____11081) {
        return or__3548__auto____11081
      }else {
        var or__3548__auto____11082 = cljs.core._dispatch["_"];
        if(or__3548__auto____11082) {
          return or__3548__auto____11082
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__11083 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__11084 = cljs.core._get_method.call(null, mf, dispatch_val__11083);
  if(cljs.core.truth_(target_fn__11084)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__11083)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__11084, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__11085 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__11086 = this;
  cljs.core.swap_BANG_.call(null, this__11086.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11086.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11086.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11086.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__11087 = this;
  cljs.core.swap_BANG_.call(null, this__11087.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__11087.method_cache, this__11087.method_table, this__11087.cached_hierarchy, this__11087.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__11088 = this;
  cljs.core.swap_BANG_.call(null, this__11088.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__11088.method_cache, this__11088.method_table, this__11088.cached_hierarchy, this__11088.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__11089 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__11089.cached_hierarchy), cljs.core.deref.call(null, this__11089.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__11089.method_cache, this__11089.method_table, this__11089.cached_hierarchy, this__11089.hierarchy)
  }
  var temp__3695__auto____11090 = cljs.core.deref.call(null, this__11089.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____11090)) {
    var target_fn__11091 = temp__3695__auto____11090;
    return target_fn__11091
  }else {
    var temp__3695__auto____11092 = cljs.core.find_and_cache_best_method.call(null, this__11089.name, dispatch_val, this__11089.hierarchy, this__11089.method_table, this__11089.prefer_table, this__11089.method_cache, this__11089.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____11092)) {
      var target_fn__11093 = temp__3695__auto____11092;
      return target_fn__11093
    }else {
      return cljs.core.deref.call(null, this__11089.method_table).call(null, this__11089.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11094 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11094.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__11094.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11094.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11094.method_cache, this__11094.method_table, this__11094.cached_hierarchy, this__11094.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__11095 = this;
  return cljs.core.deref.call(null, this__11095.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__11096 = this;
  return cljs.core.deref.call(null, this__11096.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__11097 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11097.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11098__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__11098 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11098__delegate.call(this, _, args)
  };
  G__11098.cljs$lang$maxFixedArity = 1;
  G__11098.cljs$lang$applyTo = function(arglist__11099) {
    var _ = cljs.core.first(arglist__11099);
    var args = cljs.core.rest(arglist__11099);
    return G__11098__delegate(_, args)
  };
  G__11098.cljs$lang$arity$variadic = G__11098__delegate;
  return G__11098
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("popup");
goog.require("cljs.core");
popup.foo = function foo() {
  return popup.log.call(null, "Hello world")
};
goog.exportSymbol("popup.foo", popup.foo);
goog.provide("content");
goog.require("cljs.core");
content.foo = function foo() {
  return content.log.call(null, "Hello world")
};
goog.exportSymbol("content.foo", content.foo);
