export interface AIService {
  id: string;
  name: string;
  url: string;
  displayUrl: string;
  description: string;
  color: string; // Hex color for brand accent
  iconKey: string; // Identifier for icon
  isDefault?: boolean;
  createdAt?: number;
  customHeaders?: Record<string, string>;
  notes?: string;
}

export type ViewMode = 'single' | 'split';

export interface UserPreferences {
  lastSelectedServiceId: string;
  splitServiceId: string;
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  scratchpadContent: string;
  showShortcutsHint: boolean;
  splitRatio: number; // 20 to 80 (percentage)
}
