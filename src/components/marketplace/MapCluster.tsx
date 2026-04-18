interface MapClusterProps {
  count: number;
}

export default function MapCluster({ count }: MapClusterProps) {
  const size = count > 20 ? 'w-12 h-12 text-sm' : count > 10 ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';

  return (
    <div className={`${size} rounded-full bg-[#1A2F3F] text-white font-bold flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 transition-transform`}>
      {count}
    </div>
  );
}
