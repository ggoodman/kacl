declare module 'keep-a-changelog' {
  export function parser(text: string): Changelog;

  export class Changelog {
    readonly releases: Release[];
    url: string;

    constructor(title: string);

    addRelease(release: Release): this;

    findRelease(version?: string): Release | undefined;
  }

  export class Release {
    date: Date;
    version: string;

    constructor();

    addChange(
      type: 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security',
      change: string
    ): this;

    isEmpty(): boolean;

    setVersion(version: string): this;
  }
}
