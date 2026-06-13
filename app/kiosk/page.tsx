export default function KioskPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome!</h2>
        <p className="text-gray-500 mb-8">Type your name to check in or out.</p>
        {/* TODO: KioskSearch component */}
        <div className="h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
          Student search — coming soon
        </div>
      </div>
    </div>
  )
}
