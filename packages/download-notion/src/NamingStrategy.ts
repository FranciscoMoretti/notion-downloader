import { NotionDatabase } from "./NotionDatabase"
import { NotionPage } from "./NotionPage"

export abstract class NamingStrategy {
  public abstract nameForPage(page: NotionPage): string
  public abstract nameForDatabase(page: NotionDatabase): string
}
