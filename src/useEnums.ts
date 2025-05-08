// We need a way to get this...
const useEnums: MagicEnumsInterface = {};

export function setEnums(options: { [x: string]: any }) {
  for (const key in options) {
    useEnums[key] = new Proxy(options[key], {
      get(target, prop) {
        if (typeof prop !== "string") {
          return false;
        }

        const normalisedKey = prop.replaceAll(" ", "");

        if (Reflect.has(target, normalisedKey)) {
          return Reflect.get(target, normalisedKey);
        }

        return false;
      },
    });
  }

  // Prevent any mutations.
  Object.freeze(useEnums);
}

export async function vueEnumPlugin(path: string) {
  const enumResponse = await fetch(path);
  const enums = await enumResponse.json();

  return {
    install() {
      setEnums(enums);
    },
  };
}

export default function () {
  return useEnums;
}
