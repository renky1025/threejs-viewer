declare module 'occt-import-js' {
  interface OcctImportModule {
    ReadBrepFile(content: Uint8Array, params: any): any
    ReadStepFile(content: Uint8Array, params: any): any
    ReadIgesFile(content: Uint8Array, params: any): any
  }

  export default function occtimportjs(): Promise<OcctImportModule>
}
