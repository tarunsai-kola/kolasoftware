const fs = require('fs');
const path = require('path');

const replaceInFile = (filePath, replacer) => {
  const p = path.join(__dirname, filePath);
  if (!fs.existsSync(p)) return;
  const content = fs.readFileSync(p, 'utf8');
  let newContent = replacer(content);
  
  if (content !== newContent) {
    // Add import if we used getErrorMessage and it's not imported
    if (newContent.includes('getErrorMessage(') && !newContent.includes('getErrorMessage')) {
      // we need to add the import carefully. Just a simple check above is flawed.
    }
    if (newContent.includes('getErrorMessage(') && !content.includes('getErrorMessage')) {
       // Insert import after the last import, or at the top
       if (newContent.includes('import ')) {
         newContent = newContent.replace(/(import .+\n)(?!import )/, `$1import { getErrorMessage } from '@/lib/utils/error'\n`);
       } else {
         newContent = `import { getErrorMessage } from '@/lib/utils/error'\n` + newContent;
       }
    }
    fs.writeFileSync(p, newContent, 'utf8');
    console.log('Fixed', filePath);
  }
};

replaceInFile('components/dashboard/MenuItemModal.tsx', c => {
  return c.replace(/catch \(error: any\)/g, 'catch (error: unknown)')
          .replace(/toast\.error\(error\.message\)/g, 'toast.error(getErrorMessage(error))');
});

replaceInFile('app/api/payments/webhook/route.ts', c => {
  return c.replace(/catch \(error: any\)/g, 'catch (error: unknown)')
          .replace(/error\.message\)/g, 'getErrorMessage(error))');
});

replaceInFile('app/admin/login/page.tsx', c => {
  return c.replace(/catch \(error: any\)/g, 'catch (error: unknown)')
          .replace(/toast\.error\(error\.message\)/g, 'toast.error(getErrorMessage(error))');
});

replaceInFile('app/(super-admin)/restaurants/[id]/actions.ts', c => {
  return c.replace(/catch \(error: any\)/g, 'catch (error: unknown)')
          .replace(/error: error\.message/g, 'error: getErrorMessage(error)');
});

replaceInFile('app/(storefront)/page.tsx', c => {
  return c.replace(/catch \(error\)/g, 'catch (error: unknown)')
          .replace(/error\.message\)/g, 'getErrorMessage(error))');
});

replaceInFile('app/(dashboard)/login/page.tsx', c => {
  return c.replace(/catch \(error: any\)/g, 'catch (error: unknown)')
          .replace(/toast\.error\(error\.message\)/g, 'toast.error(getErrorMessage(error))');
});
