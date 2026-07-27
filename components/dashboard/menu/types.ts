export interface MenuAddon {
  id: string
  name: string
  price: number
  is_available: boolean
}

export interface MenuAddonGroup {
  id: string
  name: string
  min_selections: number
  max_selections: number
  is_required: boolean
  addons: MenuAddon[]
}

export interface MenuVariant {
  id: string
  name: string
  price: number
}

export interface MenuVariantGroup {
  id: string
  name: string
  variants: MenuVariant[]
}

export interface MenuItemDraft {
  id?: string
  restaurant_id: string
  name: string
  description: string
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  sort_order: number
  
  // New Complex Fields (Mock state for UI)
  food_type: 'veg' | 'non-veg' | 'egg' | null
  cuisine_tags: string[]
  prep_time_minutes: number
  spice_level: 'none' | 'mild' | 'medium' | 'spicy' | 'extra-spicy' | null
  sku: string
  
  discounted_price: number | null
  portion_size: string | null
  dine_in_price: number | null
  delivery_price: number | null
  
  variant_groups: MenuVariantGroup[]
  addon_groups: MenuAddonGroup[]
  
  schedule_type: 'always' | 'scheduled'
  schedule_slots: {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
    start_time: string
    end_time: string
  }[]
}

export const defaultDraftItem: Partial<MenuItemDraft> = {
  name: '',
  description: '',
  price: 0,
  category: '',
  image_url: null,
  is_available: true,
  food_type: null,
  cuisine_tags: [],
  prep_time_minutes: 15,
  spice_level: null,
  sku: '',
  discounted_price: null,
  portion_size: null,
  dine_in_price: null,
  delivery_price: null,
  variant_groups: [],
  addon_groups: [],
  schedule_type: 'always',
  schedule_slots: []
}
