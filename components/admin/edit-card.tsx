"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit } from "lucide-react";
import {
  CardsRecord,
  SongsRecord,
  CardsTypeOptions,
} from "@/lib/types/pocketbase";
import pb from "@/lib/pocketbase";
import { toast } from "sonner";

type CardWithDetails = CardsRecord & {
  songData?: SongsRecord;
};

interface EditCardProps {
  card: CardWithDetails;
  onCardUpdated: () => void;
}

export function EditCard({ card, onCardUpdated }: EditCardProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: card.type,
    year: card.year || "",
    ost: card.ost || "",
    opening: card.opening || "",
    ad: card.ad || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData: Partial<CardsRecord> = {
        type: formData.type,
        year: formData.year || undefined,
      };

      // Limpiar campos según el tipo
      if (formData.type === "ost") {
        updateData.ost = formData.ost;
        updateData.opening = "";
        updateData.ad = "";
      } else if (formData.type === "opening") {
        updateData.opening = formData.opening;
        updateData.ost = "";
        updateData.ad = "";
      } else if (formData.type === "ad") {
        updateData.ad = formData.ad;
        updateData.ost = "";
        updateData.opening = "";
      } else if (formData.type === "song") {
        updateData.ost = "";
        updateData.opening = "";
        updateData.ad = "";
      }

      await pb.collection("cards").update(card.id, updateData);

      toast.success("Card updated successfully");
      setOpen(false);
      onCardUpdated();
    } catch (error) {
      console.error("Error updating card:", error);
      toast.error("Failed to update card");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription>
            Update the card information. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Card Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as CardsTypeOptions })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="song">Song</SelectItem>
                  <SelectItem value="ost">OST</SelectItem>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="ad">Ad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "ost" && (
              <div className="space-y-2">
                <Label htmlFor="ost">OST Title</Label>
                <Input
                  id="ost"
                  value={formData.ost}
                  onChange={(e) =>
                    setFormData({ ...formData, ost: e.target.value })
                  }
                  placeholder="Enter OST title"
                />
              </div>
            )}

            {formData.type === "opening" && (
              <div className="space-y-2">
                <Label htmlFor="opening">Opening Title</Label>
                <Input
                  id="opening"
                  value={formData.opening}
                  onChange={(e) =>
                    setFormData({ ...formData, opening: e.target.value })
                  }
                  placeholder="Enter opening title"
                />
              </div>
            )}

            {formData.type === "ad" && (
              <div className="space-y-2">
                <Label htmlFor="ad">Ad Title</Label>
                <Input
                  id="ad"
                  value={formData.ad}
                  onChange={(e) =>
                    setFormData({ ...formData, ad: e.target.value })
                  }
                  placeholder="Enter ad title"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                placeholder="Enter year"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
