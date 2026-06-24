import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * CSV 파일을 생성하고 다운로드합니다.
 * @param data CSV 데이터 (2차원 배열)
 * @param filename 다운로드할 파일명
 */
export function downloadCSV(data: string[][], filename: string) {
  // BOM 추가로 한글 깨짐 방지
  const BOM = "\uFEFF";
  const csvContent = data.map(row => row.join(",")).join("\n");
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
