import type { LucideProps } from "lucide-react";
import {
  BadgePlus,
  Film,
  Heart,
  House,
  MessageCircle,
  Search,
  Telescope,
} from "lucide-react";

export type TSidebarList = {
  title: string;
  active: boolean;
  icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  img?: string;
};

export const sidebarLists: TSidebarList[] = [
  {
    title: "Trang chủ",
    active: true,
    icon: House,
  },
  {
    title: "Tìm kiếm",
    active: false,
    icon: Search,
  },
  {
    title: "Khám phá",
    active: false,
    icon: Telescope,
  },
  {
    title: "Reels",
    active: false,
    icon: Film,
  },
  {
    title: "Tin nhắn",
    active: false,
    icon: MessageCircle,
  },
  {
    title: "Thông báo",
    active: false,
    icon: Heart,
  },
  {
    title: "Tạo",
    active: false,
    icon: BadgePlus,
  },
  {
    title: "Trang cá nhân",
    active: false,
    img: "/profile.jpg",
  },
];

export const profiles = [
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
  "/profile.jpg",
];

export const siderightFooterLists = [
  "About",
  "Help",
  "API",
  "Jobs",
  "Privacy",
  "Terms",
  "Locations",
  "Language",
  "Meta Verified",
];
