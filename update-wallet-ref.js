const fs = require('fs');

let content = fs.readFileSync('src/app/[locale]/dashboard/wallet/page.tsx', 'utf8');

const target1 = `      // Create withdrawal request for admin panel
      const { error: wdError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: session.user.id,
          amount: Number(amount),
          method: methodName,
          account_number: accountNum,
          payment_method: methodName,
          status: 'pending'
        });`;

const replacement1 = `      // Create withdrawal request for admin panel
      const { data: wdData, error: wdError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: session.user.id,
          amount: Number(amount),
          method: methodName,
          account_number: accountNum,
          payment_method: methodName,
          status: 'pending'
        })
        .select()
        .single();`;

const target2 = `      // Create transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: 'withdrawal',
          amount: Number(amount),
          description: \`Withdrawal via \${methodName} to \${accountNum}\`,
          status: 'pending'
        });`;

const replacement2 = `      // Create transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: 'withdrawal',
          amount: Number(amount),
          description: \`Withdrawal via \${methodName} to \${accountNum}\`,
          status: 'pending',
          reference_id: wdData.id
        });`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);

fs.writeFileSync('src/app/[locale]/dashboard/wallet/page.tsx', content);
