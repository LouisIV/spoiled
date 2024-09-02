export function createValueSetCallbackProxy(target: any, callback: () => void) {
  return new Proxy(target, {
    set: function (obj, prop, value) {
      obj[prop] = value;
      // Trigger the callback when the value is set
      callback();
      return true;
    },
  });
}
