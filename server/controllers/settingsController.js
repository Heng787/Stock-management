// server/controllers/settingsController.js
import * as settingsService from '../services/settingsService.js';
import * as exportService from '../services/exportService.js';

export const getSettings = async (req, res, next) => {
  try {
    const data = await settingsService.getSettings();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const updateSettings = async (req, res, next) => {
  try {
    const data = await settingsService.updateSettings(req.body);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const uploadLogo = async (req, res, next) => {
  try {
    const logoUrl = await settingsService.handleLogoUpload(req.file);
    res.json({ success: true, data: { logo: logoUrl } });
  } catch (err) { next(err); }
};

export const exportData = async (req, res, next) => {
  try {
    const { resource } = req.params;
    const { headers, rows } = await exportService.generateCSV(resource);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => { 
      const escapedRow = row.map(cell => {
        let str = String(cell || '');
        // Prevent CSV Injection (Formula Injection)
        if (/^[=+\-@\t\r]/.test(str)) {
          str = "'" + str;
        }
        return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvContent += escapedRow.join(',') + '\n'; 
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${resource}_${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csvContent);
  } catch (err) { next(err); }
};

export const triggerBackup = async (req, res, next) => {
  try {
    const backupInfo = await exportService.createJSONBackup();
    res.json({ 
      success: true, 
      message: 'System backup generated successfully',
      data: backupInfo
    });
  } catch (err) { next(err); }
};

export const clearDatabase = async (req, res) => {
  try {
    const result = await settingsService.clearDatabase(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
