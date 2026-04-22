declare module 'occt-import-js' {
  interface OcctImportInitOptions {
    locateFile?: (path: string, scriptDirectory: string) => string
  }

  interface OcctImportModule {
    ReadBrepFile(content: Uint8Array, params: any): any
    ReadStepFile(content: Uint8Array, params: any): any
    ReadIgesFile(content: Uint8Array, params: any): any
  }

  export default function occtimportjs(options?: OcctImportInitOptions): Promise<OcctImportModule>
}
