/**
 * Exports data to a CSV file and triggers a browser download.
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file (without extension)
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const val = row[header] === null || row[header] === undefined ? '' : row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = ('' + val).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
