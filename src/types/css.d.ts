/**
 * Allow TypeScript to resolve CSS file imports.
 * Vite handles these at build time; tsc just needs to know they exist.
 */
declare module '*.css' {
    const content: string;
    export default content;
}
