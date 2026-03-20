export function OrganizationSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
      <div className="flex flex-col items-center gap-4">
        {/* macOS-style Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Loading Organization...
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please wait while we fetch your settings
          </p>
        </div>
      </div>
    </div>
  );
}

export function MembersTableSkeleton() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        {/* Small Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-3 border-gray-200 dark:border-gray-700"></div>
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Loading members...
        </p>
      </div>
    </div>
  );
}
