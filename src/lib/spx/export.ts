import path from 'path';
import ExcelJS from 'exceljs';
import type { Order, OrderItem } from '@/types/database';

export interface SPXOrderExportItem extends Order {
  items: OrderItem[];
}

export interface SPXExportResult {
  buffer: Buffer;
  validOrdersCount: number;
  totalRowsCount: number;
  errors: Array<{ orderCode: string; message: string }>;
}

export async function generateSPXMassOrderExcel(
  orders: SPXOrderExportItem[],
  templatePath?: string
): Promise<SPXExportResult> {
  const resolvedTemplatePath =
    templatePath ||
    path.join(process.cwd(), 'assets', 'spx_template.xlsx');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(resolvedTemplatePath);

  const worksheet = workbook.getWorksheet('Tạo đơn (địa chỉ mới)');
  if (!worksheet) {
    throw new Error("Không tìm thấy sheet 'Tạo đơn (địa chỉ mới)' trong file template SPX");
  }

  const errors: Array<{ orderCode: string; message: string }> = [];
  let currentRowIndex = 2; // Data starts from row 2
  let orderSequence = 1;

  for (const order of orders) {
    // Basic validation
    if (!order.phone || order.phone.length < 10) {
      errors.push({ orderCode: order.code, message: 'Số điện thoại không hợp lệ' });
      continue;
    }
    if (!order.address_province || !order.address_ward) {
      errors.push({ orderCode: order.code, message: 'Thiếu tỉnh/thành hoặc phường/xã' });
      continue;
    }
    if (!order.items || order.items.length === 0) {
      errors.push({ orderCode: order.code, message: 'Đơn hàng không có sản phẩm' });
      continue;
    }

    const isCOD = order.payment_method === 'cod';
    const codAmount = isCOD ? order.total : 0;
    const totalWeightKg = order.items.reduce((sum, it) => sum + (it.quantity * 0.2), 0); // default 0.2kg/item

    // Each order can have multiple items. First row contains recipient details.
    order.items.forEach((item, itemIdx) => {
      const row = worksheet.getRow(currentRowIndex);

      // Col A: STT đơn hàng trong file
      row.getCell('A').value = orderSequence;

      // Only fill customer recipient details on the FIRST row of the order
      if (itemIdx === 0) {
        row.getCell('B').value = order.customer_name;
        row.getCell('C').value = String(order.phone); // text format to preserve leading zero
        row.getCell('D').value = order.address_province;
        row.getCell('E').value = order.address_ward;
        row.getCell('F').value = `${order.address_detail}, ${order.address_ward}, ${order.address_province}`;
        row.getCell('L').value = Number(totalWeightKg.toFixed(3));
        row.getCell('P').value = order.code; // Mã khách hàng = Mã đơn website
        row.getCell('Q').value = order.subtotal; // Giá trị hàng
        row.getCell('R').value = 'N'; // Giao hàng một phần
        row.getCell('S').value = 'N'; // Cho phép thử hàng
        row.getCell('T').value = 'N'; // Cho xem hàng, không cho thử
        row.getCell('W').value = isCOD ? 'Y' : 'N';
        if (isCOD) {
          row.getCell('X').value = codAmount;
        }
        row.getCell('Y').value = 'N'; // Bưu gửi giá trị cao
        row.getCell('Z').value = 'Người gửi trả';
        row.getCell('AA').value = order.note ? String(order.note).substring(0, 100) : '';
      }

      // Col I, J, K: Product name, Quantity, Price
      row.getCell('I').value = `${item.product_name_snapshot} - ${item.variant_name_snapshot}`;
      row.getCell('J').value = item.quantity;
      row.getCell('K').value = item.unit_price;

      row.commit();
      currentRowIndex++;
    });

    orderSequence++;
  }

  // Remove all instructions, sample, and reference sheets so ONLY the orders sheet remains
  const sheetsToRemove = workbook.worksheets.filter(
    (ws) => ws.name !== 'Tạo đơn (địa chỉ mới)'
  );
  for (const ws of sheetsToRemove) {
    workbook.removeWorksheet(ws.id);
  }

  // Ensure the single orders sheet is active and selected
  worksheet.views = [{ state: 'normal', activeCell: 'A1', showGridLines: true }];

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return {
    buffer,
    validOrdersCount: orderSequence - 1,
    totalRowsCount: currentRowIndex - 2,
    errors,
  };
}
