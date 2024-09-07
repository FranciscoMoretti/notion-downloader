// Defining naming strategies

import { slug } from "github-slugger"
import sanitize from "sanitize-filename"

import { NotionDatabase } from "./../NotionDatabase"
import { NotionObject } from "./../NotionObject"
import { NotionPage } from "./../NotionPage"
import { NamingStrategy } from "./NamingStrategy"

export abstract class SlugNamingStrategy extends NamingStrategy {
  public slugProperty: string

  constructor(slugProperty: string) {
    super(["page", "database"])
    this.slugProperty = slugProperty || "Slug"
  }

  protected _nameForObject(notionObject: NotionDatabase | NotionPage): string {
    if (notionObject.object == "page") {
      return this._nameForPage(notionObject as NotionPage)
    } else if (notionObject.object == "database") {
      return this._nameForDatabase(notionObject as NotionDatabase)
    } else {
      throw new Error(`Unknown object type: ${typeof notionObject}`)
    }
  }

  private _nameForPage(page: NotionPage): string {
    const explicitSlug = page.getPlainTextProperty(this.slugProperty, "")

    return explicitSlug || this._slugify(page.title)
  }
  private _nameForDatabase(database: NotionDatabase): string {
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
  constructor() {
    super(["page", "database", "block"])
  }

  protected _nameForObject(notionObject: NotionObject): string {
    return notionObject.id
  }
}

export class TitleNamingStrategy extends NamingStrategy {
  constructor() {
    super(["page", "database"])
  }

  protected _nameForObject(notionObject: NotionDatabase | NotionPage): string {
    return notionObject.title
  }
}