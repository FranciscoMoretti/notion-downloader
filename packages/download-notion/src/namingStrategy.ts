// Defining naming strategies

import { slug } from "github-slugger"
import sanitize from "sanitize-filename"

import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

export abstract class NamingStrategy {
  public abstract nameForPage(page: NotionPage): string
  public abstract nameForDatabase(page: NotionDatabase): string
}

export abstract class SlugNamingStrategy extends NamingStrategy {
  public slugProperty: string

  constructor(slugProperty: string) {
    super()
    this.slugProperty = slugProperty || "Slug"
  }

  public nameForPage(page: NotionPage): string {
    // TODO This logic needs to be handled either here or in the page.
    const explicitSlug = page.getPlainTextProperty(this.slugProperty, "")

    return explicitSlug || this._slugify(page.nameOrTitle)
  }
  public nameForDatabase(database: NotionDatabase): string {
    return this._slugify(database.title)
  }

  abstract _slugify(name: string): string
}

export class GithubSlugNamingStrategy extends SlugNamingStrategy {
  _slugify(name: string): string {
    return slug(name)
  }
}

export class NotionSlugNamingStrategy extends SlugNamingStrategy {
  _slugify(name: string): string {
    return (
      sanitize(name)
        .replace(/^\//, "")
        // If for some reason someone types in a slug with special characters,
        //we really don't want to see ugly entities in the URL, so first
        // we replace a bunch of likely suspects with dashes. This will not
        // adequately handle the case where there is one pag with slug:"foo-bar"
        // and another with "foo?bar". Both will come out "foo-bar"
        .replaceAll(" ", "-")
        .replaceAll("?", "-")
        .replaceAll("/", "-")
        .replaceAll("#", "-")
        .replaceAll("&", "-")
        .replaceAll("%", "-")
        // remove consecutive dashes
        .replaceAll("--", "-")
    )
  }
}

export class GuidNamingStrategy extends NamingStrategy {
  public nameForPage(page: NotionPage): string {
    return page.id
  }
  public nameForDatabase(database: NotionDatabase): string {
    return database.id
  }
}

export class TitleNamingStrategy extends NamingStrategy {
  public nameForPage(page: NotionPage): string {
    return page.nameOrTitle
  }
  public nameForDatabase(database: NotionDatabase): string {
    return database.title
  }
}

// TODO: Do we need a strategy for Notion Slugs ?
