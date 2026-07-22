"use client";

/** Thin specialization of ArrayFieldEditor for simple `string[]` fields
 * (inclusions, exclusions, highlights, terms & conditions, best season) —
 * still the same repeater primitive underneath. */
import { Input } from "@/components/ui/input";
import { ArrayFieldEditor } from "./array-field-editor";

export function StringListEditor({
  items,
  onChange,
  placeholder = "Enter text",
  addLabel = "Add",
}: {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <ArrayFieldEditor<string>
      items={items}
      onChange={onChange}
      createItem={() => ""}
      addLabel={addLabel}
      renderItem={(value, index) => (
        <Input
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const next = items.slice();
            next[index] = e.target.value;
            onChange(next);
          }}
        />
      )}
    />
  );
}
