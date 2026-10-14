import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";

export const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
export const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const notoArabe = Noto_Sans_Arabic({ variable: "--font-arabe", subsets: ["arabic"], weight: ["400", "600", "700"] });

export const classesPolices = `${geistSans.variable} ${geistMono.variable} ${notoArabe.variable}`;
