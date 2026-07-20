import { Image as ImageIcon, Columns2, PanelLeft, Grid2x2 } from "lucide-react";

export type SectionType = "single_image" | "two_image" | "image_content" | "four_column";

export interface SectionDef {
  type: SectionType;
  label: string;
  icon: any;
  defaultData: Record<string, any>;
}

const emptyColumn = () => ({ image: "", alt: "", heading: "", content: "" });

export const SECTION_TYPES: SectionDef[] = [
  {
    type: "single_image",
    label: "Single Image",
    icon: ImageIcon,
    defaultData: { title: "", image: "", alt: "", caption: "" },
  },
  {
    type: "two_image",
    label: "Two Images Side-by-Side",
    icon: Columns2,
    defaultData: { title: "", imageLeft: "", altLeft: "", imageRight: "", altRight: "" },
  },
  {
    type: "image_content",
    label: "Image + Content",
    icon: PanelLeft,
    defaultData: { title: "", image: "", alt: "", heading: "", content: "", layout: "image-left" },
  },
  {
    type: "four_column",
    label: "Four Columns",
    icon: Grid2x2,
    defaultData: {
      title: "",
      items: [emptyColumn(), emptyColumn(), emptyColumn(), emptyColumn()],
    },
  },
];

export const getSectionDef = (type: string) => SECTION_TYPES.find((s) => s.type === type);