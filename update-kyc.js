const fs = require('fs');
let content = fs.readFileSync('src/app/admin/kyc-review/page.tsx', 'utf8');

const newFunc = `  const handleConfirmReject = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      const profile = profiles.find(p => p.id === profileId);
      
      if (profile) {
        const pathsToDelete: string[] = [];
        
        const extractPath = (urlOrPath: string | null) => {
          if (!urlOrPath) return null;
          if (urlOrPath.startsWith('http')) {
            try {
              const url = new URL(urlOrPath);
              const pathParts = url.pathname.split('/kyc-docs/');
              if (pathParts.length > 1) return pathParts[1];
            } catch (e) {
              return null;
            }
          }
          return urlOrPath;
        };

        const frontPath = extractPath(profile.id_front_url);
        if (frontPath) pathsToDelete.push(frontPath);
        
        const backPath = extractPath(profile.id_back_url);
        if (backPath) pathsToDelete.push(backPath);

        if (pathsToDelete.length > 0) {
          const { error: storageError } = await supabase.storage.from('kyc-docs').remove(pathsToDelete);
          if (storageError) {
            console.error('Error deleting KYC images from storage:', storageError);
          }
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          kyc_status: 'rejected',
          kyc_reject_reason: rejectionReason || 'Your submitted documents did not meet our requirements.',
          id_front_url: null,
          id_back_url: null
        })
        .eq('id', profileId);
      if (error) throw error;
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      setIsRejectModalOpen(false);
    } catch (err: any) {
      toast.error('Error rejecting KYC: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };`;

content = content.replace(/  const handleConfirmReject = async \(profileId: string\) => {[\s\S]*?  };/, newFunc);

fs.writeFileSync('src/app/admin/kyc-review/page.tsx', content);
console.log('done');
