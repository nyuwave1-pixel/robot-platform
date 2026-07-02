interface BadgeProps {
  label: string;
  variant?: "blue" | "green" | "red" | "yellow";
}

export default function Badge({ label, variant = "blue" }: BadgeProps) {
  const colorClass = {
    blue: "bg-blue-500/20 text-blue-300",
    green: "bg-green-500/20 text-green-300",
    red: "bg-red-500/20 text-red-300",
    yellow: "bg-yellow-500/20 text-yellow-300",
  }[variant];

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colorClass}`}>
      {label}
    </span>
  );
}
