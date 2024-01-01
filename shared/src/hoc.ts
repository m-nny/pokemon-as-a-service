export const MetaName = Symbol();
export const MetaArgs = Symbol();

export type WithMeta<F, Names> = F & {
  [MetaName]: Names;
  [MetaArgs]: any[];
};

export const preserveMetaFuncHoc =
  <F extends (...args: any[]) => any>(fn: F) =>
  (...args: Parameters<F>): ReturnType<F & { [MetaArgs]: Parameters<F> }> => {
    const result = fn(...args);
    result[MetaName] = fn.name;
    result[MetaArgs] = args;
    return result;
  };
