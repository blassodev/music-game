"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import pb from "@/lib/pocketbase";
import { DecksRecord } from "@/lib/types/pocketbase";
import { toast } from "sonner";

interface DeckFormProps {
  deck?: DecksRecord;
  isEdit?: boolean;
}

export function DeckForm({ deck, isEdit = false }: DeckFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.decks.form");

  const [formData, setFormData] = useState({
    name: deck?.name || "",
    description: deck?.description || "",
    isActive: deck?.isActive ?? true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("El nombre del mazo es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (isEdit && deck) {
        // Actualizar mazo existente
        await pb.collection("decks").update(deck.id, data);
        toast.success("Mazo actualizado exitosamente");
      } else {
        // Crear nuevo mazo
        await pb.collection("decks").create(data);
        toast.success("Mazo creado exitosamente");
      }

      router.push("/admin/decks");
      router.refresh();
    } catch (error) {
      console.error("Error saving deck:", error);
      toast.error("Error al guardar el mazo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Editar Mazo" : "Crear Nuevo Mazo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("name")} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("description", e.target.value)
              }
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked: boolean) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive">{t("isActive")}</Label>
            </div>
            <p className="text-sm text-muted-foreground">{t("isActiveHelp")}</p>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                t("submit")
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
