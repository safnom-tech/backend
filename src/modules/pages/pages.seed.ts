import { Types } from "mongoose";
import { WebsiteModel } from "../websites/websites.model.js";
import type { WebsiteTheme } from "../websites/websites.model.js";
import { PageModel } from "./pages.model.js";
import type { PageType } from "./pages.model.js";
import type { SectionTypeConstant } from "./pages.constants.js";

export interface SeedPageDefinition {
  name: string;
  slug: string;
  pageType?: PageType;
  seo?: {
    title?: string | null;
    metaDescription?: string | null;
    socialImage?: string | null;
  };
  sections: {
    type: SectionTypeConstant;
    order: number;
    data: Record<string, unknown>;
    settings: Record<string, unknown>;
  }[];
}

export async function seedWebsiteContent(
  workspaceId: string,
  websiteId: string,
  input: { theme: WebsiteTheme; pages: SeedPageDefinition[] }
): Promise<void> {
  await WebsiteModel.updateOne(
    {
      _id: new Types.ObjectId(websiteId),
      workspaceId: new Types.ObjectId(workspaceId),
    },
    { $set: { theme: input.theme } }
  );

  for (const pageDef of input.pages) {
    const sections = pageDef.sections.map((s) => ({
      _id: new Types.ObjectId(),
      type: s.type,
      order: s.order,
      data: { ...s.data },
      settings: { ...s.settings },
    }));

    await PageModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      websiteId: new Types.ObjectId(websiteId),
      name: pageDef.name,
      slug: pageDef.slug,
      pageType: pageDef.pageType ?? "CUSTOM",
      status: "DRAFT",
      seo: {
        title: pageDef.seo?.title ?? null,
        metaDescription: pageDef.seo?.metaDescription ?? null,
        socialImage: pageDef.seo?.socialImage ?? null,
      },
      sections,
    });
  }
}
