type Props = {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
};

export default function AuthInput({ label, type = "text", name, placeholder = "Enter" }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-base">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full bg-white px-3 py-2 text-sm outline-none"
      />
    </div>
  );
}