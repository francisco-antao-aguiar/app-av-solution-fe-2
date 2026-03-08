export class CsvExportService {
  static exportToCsv(filename: string, rows: any[]): void {
    if (!rows || !rows.length) {
      return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);
    
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? '' : row[k];
          
          // Handle arrays (for daily hours)
          if (Array.isArray(cell)) {
            cell = cell.map(c => c === null ? 'X' : c).join('|');
          }
          
          // Escape quotes and wrap in quotes if contains separator or quotes
          cell = cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          
          return cell;
        }).join(separator);
      }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
