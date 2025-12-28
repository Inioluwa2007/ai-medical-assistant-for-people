
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}

// Added ImportMetaEnv definition to resolve the "Cannot find name 'ImportMetaEnv'" error.
interface ImportMetaEnv {
  readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
