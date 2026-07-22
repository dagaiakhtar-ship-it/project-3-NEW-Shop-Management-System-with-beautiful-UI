import { db } from '../database/db';

export interface CompanyBranding {
  shopName: string;
  shopLogo: string;
  ownerName: string;
  businessType: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  taxNumber: string;
  ntn: string;
  strn: string;
  address: string;
  city: string;
}

export const DEFAULT_BRANDING: CompanyBranding = {
  shopName: 'ShopCraft Retail',
  shopLogo: '',
  ownerName: 'John Doe',
  businessType: 'Retail Store',
  phone: '+1 (555) 832-1920',
  whatsapp: '+1 (555) 832-1920',
  email: 'contact@shopcraft.com',
  website: 'www.shopcraft.com',
  taxNumber: 'TAX-84291-SF',
  ntn: 'NTN-12948-3',
  strn: 'STRN-58291-0',
  address: '120 Market Street, Suite 4A, San Francisco, CA',
  city: 'San Francisco',
};

export async function getCompanyBranding(): Promise<CompanyBranding> {
  try {
    const settingsList = await db.settings.toArray();
    const settingsMap = new Map(settingsList.map(s => [s.key, s.value]));
    
    return {
      shopName: (settingsMap.get('shop_name') as string) || DEFAULT_BRANDING.shopName,
      shopLogo: (settingsMap.get('shop_logo') as string) || DEFAULT_BRANDING.shopLogo,
      ownerName: (settingsMap.get('owner_name') as string) || DEFAULT_BRANDING.ownerName,
      businessType: (settingsMap.get('business_type') as string) || DEFAULT_BRANDING.businessType,
      phone: (settingsMap.get('phone') as string) || DEFAULT_BRANDING.phone,
      whatsapp: (settingsMap.get('whatsapp') as string) || DEFAULT_BRANDING.whatsapp,
      email: (settingsMap.get('email') as string) || DEFAULT_BRANDING.email,
      website: (settingsMap.get('website') as string) || DEFAULT_BRANDING.website,
      taxNumber: (settingsMap.get('tax_number') as string) || DEFAULT_BRANDING.taxNumber,
      ntn: (settingsMap.get('ntn') as string) || DEFAULT_BRANDING.ntn,
      strn: (settingsMap.get('strn') as string) || DEFAULT_BRANDING.strn,
      address: (settingsMap.get('address') as string) || DEFAULT_BRANDING.address,
      city: (settingsMap.get('city') as string) || DEFAULT_BRANDING.city,
    };
  } catch (err) {
    console.warn('Failed to load settings for printing, using defaults:', err);
    return DEFAULT_BRANDING;
  }
}
