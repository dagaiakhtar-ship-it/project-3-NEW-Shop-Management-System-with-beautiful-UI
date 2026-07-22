import { db } from '../database/db';
import { getCompanyBranding, CompanyBranding } from '../constants/companyBranding';
import showToast from '../utils/toast';

export class WhatsAppService {
  static formatDate(dateInput: Date | string | undefined): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  static async getCustomerPhoneAndDetails(sale: any, customerParam?: any): Promise<{ phone: string; name: string }> {
    let phone = customerParam?.phone || '';
    let name = customerParam?.fullName || customerParam?.name || sale?.customerName || 'Walk-in Customer';

    if (!phone && sale?.customerId) {
      try {
        const customer = await db.customers.get(sale.customerId);
        if (customer) {
          phone = customer.phone || '';
          name = customer.fullName || customer.name || name;
        }
      } catch (err) {
        console.warn('Failed to fetch customer for WhatsApp:', err);
      }
    }
    return { phone, name };
  }

  static generateInvoiceMessage(branding: CompanyBranding, sale: any, items: any[], customerName: string): string {
    const invoiceNumber = sale.invoiceNumber || sale.invoiceNo || 'N/A';
    const dateStr = this.formatDate(sale.saleDate || sale.createdAt);
    
    // Format items purchased
    const itemsText = items.map((item: any) => {
      const name = item.productName || item.name || 'Product';
      const qty = item.quantity || 1;
      const price = item.sellingPrice || item.price || 0;
      const lineTotal = item.total ?? item.subtotal ?? (qty * price);
      return `• ${name} ×${qty} = Rs.${lineTotal}`;
    }).join('\n');

    const totalVal = sale.grandTotal ?? sale.total ?? 0;
    const paidVal = sale.paidAmount ?? 0;
    const remainingVal = sale.remainingAmount ?? (totalVal - paidVal);

    return `Hello ${customerName},

Thank you for shopping with ${branding.shopName}.

Invoice Number:
${invoiceNumber}

Date:
${dateStr}

Items Purchased

${itemsText}

Grand Total:
Rs.${totalVal}

Paid:
Rs.${paidVal}

Remaining:
Rs.${remainingVal}

Thank you for your visit.

Please visit again.`;
  }

  static async sendWhatsAppByInvoiceNo(invoiceNo: string): Promise<void> {
    if (!invoiceNo) {
      showToast.error('Invalid invoice number provided.');
      return;
    }
    try {
      // Query the indexed invoiceNo first, fallback safely with filter for unindexed invoiceNumber
      let sale = await db.sales.where('invoiceNo').equals(invoiceNo).first();
      if (!sale) {
        sale = await db.sales.filter(s => s.invoiceNumber === invoiceNo).first();
      }
      if (!sale) {
        showToast.error(`Invoice ${invoiceNo} not found in database.`);
        return;
      }
      const items = await db.saleItems.where('saleId').equals(sale.id!).toArray();
      await this.sendWhatsApp(sale, items);
    } catch (err: any) {
      console.error('Failed to send WhatsApp by invoice:', err);
      showToast.error('Failed to send WhatsApp.');
    }
  }

  static async sendWhatsApp(sale: any, items: any[], customerParam: any | null = null): Promise<void> {
    const branding = await getCompanyBranding();
    const { phone, name } = await this.getCustomerPhoneAndDetails(sale, customerParam);

    if (!phone || phone.trim() === '') {
      showToast.error('No WhatsApp number available.');
      return;
    }

    // Clean phone number (keep only digits)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 0) {
      showToast.error('No WhatsApp number available.');
      return;
    }

    const message = this.generateInvoiceMessage(branding, sale, items, name);
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;

    window.open(url, '_blank');
  }
}
