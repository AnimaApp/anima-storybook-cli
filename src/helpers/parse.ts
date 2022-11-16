import { camelCase, get, isArray, isObject, isString, isNumber, isEmpty } from "lodash";
import ShortUniqueId from "short-unique-id";
import { Parser } from "expr-eval";

const SPEC_STRING_UNIT_TYPES = ["dimension"];

const CUSTOM_STRING_UNIT_TYPES = [
  "spacing",
  "lineHeights",
  "borderRadius",
  "fontSizes",
];
const STRING_UNIT_TYPES = [
  ...SPEC_STRING_UNIT_TYPES,
  ...CUSTOM_STRING_UNIT_TYPES,
];


type DSTokenType = "PAINT" | "TEXT" | "EFFECT" | "unknown";

type DSToken = {
  name: string;
  value: string;
  id: string;
  type: DSTokenType;
}

type ShadowToken = {
  color: string;
  offsetX?: string | number;
  offsetY?: string | number;
  x?: string | number;
  y?: string | number;
  blur: string | number;
  spread: string | number;
}


type DSTokenMap = Record<string, DSToken>;



const uid = new ShortUniqueId({ length: 6 });

const getStringWithUnit = (inp: string | number | undefined) => {
  if (!isString(inp) && !isNumber(inp)) return "";
  if (isNumber(inp)) {
    inp = String(inp);
  }
  // eslint-disable-next-line no-useless-escape
  const re = /[^{\}]+(?=})/g;

  const matches = inp.match(re);

  if (matches && matches.length > 0) return inp;

  const n = parseFloat(inp),
    p = inp.match(/%|em/),
    output = isNaN(n) ? "" : p ? n + p[0] : Math.round(n) + "px";
  return output;
};

const getStringsWithUnit = (values: (string | number | undefined)[]): string[] => {
  return values.map(getStringWithUnit);
};

export const parseShadowObjectToString = (
  input: ShadowToken | ShadowToken[]
): string => {
  const toString = (shadow: ShadowToken) => {
    const [offsetX, offsetY, blur, spread, x, y] = getStringsWithUnit([
      shadow.offsetX,
      shadow.offsetY,
      shadow.blur,
      shadow.spread,
      shadow.x,
      shadow.y,
    ]);

    return `${shadow.color} ${offsetX ? offsetX : x} ${offsetY ? offsetY : y
      } ${blur} ${spread}`;
  };

  if (isArray(input)) {
    return input.map(toString).join(", ");
  }
  return toString(input);
};

const flattenJSON = (tokens: Record<string, any>) => {
  const existingObjects: Record<string, any>[] = [];
  const path: string[] = [];
  const tokensArrays: any[][] = [];

  const addEntry = (entry: any) => {
    path.push(entry);
    tokensArrays.push([...path]);
    path.pop();
  };

  (function find(_tokens) {
    for (const key of Object.keys(_tokens)) {
      if (key === "$value" || key === "value") {
        const value = _tokens[key];
        const parent = get(tokens, `${path.join(".")}`);
        const type = parent?.$type || parent?.type;

        if (isString(value)) {
          addEntry({ value, type });
        } else if (isObject(value)) {
          if (type === "shadow" || type === "boxShadow") {
            const shadowToken = _tokens[key];
            const shadow = parseShadowObjectToString(shadowToken);
            addEntry({ value: shadow, type });
          }
        }
      }
      const o = _tokens[key];
      if (o && isObject(o) && !isArray(o)) {
        if (!existingObjects.find((_tokens) => _tokens === o)) {
          path.push(key);
          existingObjects.push(o);
          find(o);
          path.pop();
        }
      }
    }
  })(tokens);
  const newObject: Record<string, any> = {};
  tokensArrays.forEach((arr) => {
    const keys = arr.slice(0, -1).map((k) => {
      return k.split(" ").join("-");
    });
    const key = keys.join("-");
    const value = arr.at(-1);

    newObject[key] = value;
  });

  return sortKeys(newObject);
};

const sortKeys = (object: Record<string, any>): Record<string, any> => {
  const objectCopy = { ...object };

  return Object.keys(objectCopy)
    .sort()
    .reduce(
      (acc, key) => ({
        ...acc,
        [key]: objectCopy[key],
      }),
      {}
    );
};

const refToName = (refString: string) => {
  const cropped = refString.slice(1, -1).trim();
  return cropped.split(".").join("-").split(" ").join("-");
};

export { refToName };

export const findTrueValues = (groups: Record<string, any>): Record<string, any> => {
  const newGroups = JSON.parse(JSON.stringify(groups));
  const justPairs: Record<string, any> = {};
  Object.keys(newGroups).forEach((group) => {
    Object.assign(justPairs, newGroups[group]);
  });

  for (const pair in justPairs) {
    // eslint-disable-next-line prefer-const
    let { value, type } = justPairs[pair]
    if (!isString(value)) continue;
    // eslint-disable-next-line no-useless-escape
    const re = /[^{\}]+(?=})/g;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const refs = value.match(re);
      if (!refs || refs.length === 0) break;

      const map: Record<string, any> = {};
      let expression = `${value}`.trim();
      for (const ref of refs) {
        expression = expression.replace(`{${ref}}`, camelCase(ref));
        const name = refToName(`{${ref}}`);
        map[camelCase(ref)] = justPairs[name]?.value;
      }

      try {
        value = Parser.evaluate(expression, map)?.toString();
      } catch (error) {
        value = "";
      }
    }
    if (STRING_UNIT_TYPES.includes(type)) {
      value = getStringWithUnit(value);
    }
    if (value) {
      justPairs[pair] = { type, value };
    } else {
      delete justPairs[pair];
    }
  }
  return justPairs;
};

const isCSSColor = (value: string) => {
  if (!value) return false
  const r = (str: string, amount: number) =>
    Array.from(Array(amount))
      .map(() => str)
      .join('');
  const reducedHexRegex = new RegExp(`^#${r('([a-f0-9])', 3)}([a-f0-9])?$`, 'i');
  const hexRegex = new RegExp(`^#${r('([a-f0-9]{2})', 3)}([a-f0-9]{2})?$`, 'i');
  const rgbaRegex = new RegExp(
    `^rgba?\\(\\s*(\\d+)\\s*${r(
      ',\\s*(\\d+)\\s*',
      2
    )}(?:,\\s*([\\d.]+))?\\s*\\)$`,
    'i'
  );
  const hslaRegex = /^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\s*\)$/i;

  return hexRegex.exec(value) || reducedHexRegex.exec(value) || rgbaRegex.exec(value) || hslaRegex.exec(value)
}

const getDSTokenType = (obj: { value: string; type: string }): DSTokenType => {
  const { type, value } = obj;
  const isColor =
    type === "color" ||
    isCSSColor(value)
  const isBoxShadow =
    type === "shadow" ||
    type === "boxShadow"
  const isFontSize = type === "fontSizes"
  const isFontFamily =
    type === "fontFamily" ||
    type === "fontFamilies"

  const isFontWeight =
    type === "fontWeight" ||
    type === "fontWeights"


  const isTextStyle = isFontSize || isFontFamily || isFontWeight;
  const isEffectStyle = isBoxShadow;

  const tokenType = isColor
    ? "PAINT"
    : isTextStyle
      ? "TEXT"
      : isEffectStyle
        ? "EFFECT"
        : "unknown";

  return tokenType;
};

const convertToDSTokenMap = (pairs: Record<string, any>): DSTokenMap => {
  return Object.keys(pairs).reduce<DSTokenMap>((prev, key) => {
    const type = getDSTokenType(pairs[key]);

    prev[key] = { id: uid(), name: key, value: pairs[key]?.value, type };
    return prev;
  }, {});
};

export const flattenToPairs = (json: Record<string, any>): Record<string, any> => {
  const pairs = flattenJSON(json);
  return findTrueValues({ pairs });
};

export const convertDSToJSON = (json: Record<string, any>): DSTokenMap => {
  if (!json || isEmpty(json)) return {}
  const resolvedPairs = flattenToPairs(json);
  return convertToDSTokenMap(resolvedPairs);
};
