import {
  BriefcaseBusiness,
  Coffee,
  CookingPot,
  PackageCheck,
  ScanBarcode,
  Shirt,
  ShoppingBasket,
  Store,
  UtensilsCrossed,
  Weight,
} from 'lucide-react'

export const ONBOARDING_STORAGE_KEY = 'vigo::onboarding-draft:v2'

export const steps = [
  { id: 'welcome', short: 'Start', title: 'Welcome' },
  { id: 'business', short: 'Business', title: 'Business type' },
  { id: 'operations', short: 'Operations', title: 'Sales workflow' },
  { id: 'store', short: 'Store', title: 'Store information' },
  { id: 'review', short: 'Review', title: 'Review setup' },
  { id: 'success', short: 'Complete', title: 'Setup complete' },
]

export const businessOptions = [
  { value: 'Toko Umum', label: 'Retail', description: 'Everyday retail and general goods', icon: ShoppingBasket, color: 'blue' },
  { value: 'Food dan Beverages', label: 'Cafe', description: 'Coffee, snacks, and takeaway', icon: Coffee, color: 'amber' },
  { value: 'Food dan Beverages', variant: 'restaurant', label: 'Restaurant', description: 'Menu, tables, and orders', icon: UtensilsCrossed, color: 'orange' },
  { value: 'Pakaian dan Accessories', label: 'Fashion', description: 'Sizes, colors, and variants', icon: Shirt, color: 'violet' },
  { value: 'Services', label: 'Services', description: 'Services without physical inventory', icon: BriefcaseBusiness, color: 'emerald' },
  { value: 'Custom', label: 'Other', description: 'Customize to your needs', icon: Store, color: 'slate' },
]

export const salesOptions = [
  { id: 'counter', title: 'Counter POS', description: 'Fast in-store transactions', icon: ScanBarcode },
  { id: 'order', title: 'Orders', description: 'Record orders before payment', icon: CookingPot },
]

export const stockOptions = [
  { id: 'basic', title: 'Simple inventory', description: 'Stock quantity per product', icon: PackageCheck },
  { id: 'variant', title: 'Variant inventory', description: 'Sizes, colors, or flavors', icon: Shirt },
  { id: 'weighted', title: 'Weight & volume', description: 'Kg, grams, liters, or meters', icon: Weight },
]

export const defaultValues = {
  businessType: '',
  businessVariant: '',
  salesMode: 'counter',
  stockTypesManaged: ['basic'],
  storeName: '',
  address: '',
  whatsapp: '',
  logo: '',
}

export function getBusinessLabel(values) {
  return businessOptions.find(
    (option) => option.value === values.businessType && (option.variant || '') === (values.businessVariant || ''),
  )?.label || values.businessType || 'Not selected'
}

