import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "HH:mm");
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return format(date, "MMM d");
  }
}

export const ROMANIAN_CITIES = [
  "București", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", 
  "Brașov", "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești", 
  "Sibiu", "Bacău", "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani", 
  "Satu Mare", "Râmnicu Vâlcea", "Drobeta-Turnu Severin", "Suceava", 
  "Piatra Neamț", "Deva", "Focșani", "Tulcea", "Zalău", "Sfântu Gheorghe", 
  "Bistrița", "Reșița", "Alba Iulia", "Giurgiu", "Slobozia", "Alexandria", 
  "Vaslui", "Turda", "Câmpina", "Hunedoara", "Lugoj", "Mediaș", "Buziaș", 
  "Onești", "Roman", "Sighetu Marmației", "Gheorgheni", "Turnu Măgurele"
].sort();

export const LEVEL_RANKS = [
  { max: 5, name: "Beginner", color: "text-gray-400" },
  { max: 15, name: "Explorer", color: "text-green-400" },
  { max: 25, name: "Romantic", color: "text-pink-400" },
  { max: 35, name: "Charmer", color: "text-purple-400" },
  { max: 45, name: "Heartbreaker", color: "text-red-500" },
  { max: 100, name: "Legend", color: "text-yellow-400" },
];

export function getRankByLevel(level: number) {
  return LEVEL_RANKS.find(r => level <= r.max) || LEVEL_RANKS[LEVEL_RANKS.length - 1];
}
