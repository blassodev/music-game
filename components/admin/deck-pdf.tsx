"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { CardsRecord, SongsRecord } from "@/lib/types/pocketbase";

type CardWithDetails = CardsRecord & {
  songData?: SongsRecord;
  qrCodeDataUrl?: string;
};

interface DeckPDFProps {
  cards: CardWithDetails[];
  deckName: string;
}

// Estilos para el PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    backgroundColor: "#ffffff",
  },
  card: {
    width: "64mm",
    height: "64mm",
    border: "1pt solid #000000",
    margin: 2,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  topText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  middleText: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomText: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "100%",
    paddingHorizontal: 4,
  },
  qrPage: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    backgroundColor: "#ffffff",
  },
  qrCard: {
    width: "64mm",
    height: "64mm",
    border: "1pt solid #000000",
    margin: 2,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  qrImage: {
    width: "58mm",
    height: "58mm",
  },
  yearContainer: {
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "40mm",
  },
});

export const DeckPDF: React.FC<DeckPDFProps> = ({ cards, deckName }) => {
  const getCardYear = (card: CardWithDetails) => {
    if (card.songData) {
      return card.songData.year?.toString() || "N/A";
    }
    return card.year || "N/A";
  };

  const renderCardContent = (card: CardWithDetails) => {
    switch (card.type) {
      case "song":
        return (
          <>
            <Text style={styles.topText}>
              {card.songData?.artist || "Artista desconocido"}
            </Text>
            <View style={styles.yearContainer}>
              <Text style={styles.middleText}>{getCardYear(card)}</Text>
            </View>
            <Text style={styles.bottomText}>
              {card.songData?.title || "Sin título"}
            </Text>
          </>
        );
      case "ost":
        return (
          <>
            <Text style={styles.topText}>
              {card.songData?.title || "Sin título"}
            </Text>
            <View style={styles.yearContainer}>
              <Text style={styles.middleText}>{getCardYear(card)}</Text>
            </View>
            <Text style={styles.bottomText}>{card.ost || "OST"}</Text>
          </>
        );
      case "opening":
        return (
          <>
            <Text style={styles.topText}>
              {card.songData?.title || "Sin título"}
            </Text>
            <View style={styles.yearContainer}>
              <Text style={styles.middleText}>{getCardYear(card)}</Text>
            </View>
            <Text style={styles.bottomText}>{card.opening || "Opening"}</Text>
          </>
        );
      case "ad":
        return (
          <>
            <Text style={styles.topText}>
              {card.songData?.title || "Sin título"}
            </Text>
            <View style={styles.yearContainer}>
              <Text style={styles.middleText}>{getCardYear(card)}</Text>
            </View>
            <Text style={styles.bottomText}>{card.ad || "Anuncio"}</Text>
          </>
        );
      default:
        return <Text>Tipo de card desconocido</Text>;
    }
  };

  return (
    <Document>
      {/* Página con las cartas (frente) */}
      <Page size="A4" style={styles.page}>
        {cards.map((card) => (
          <View key={card.id} style={styles.card}>
            {renderCardContent(card)}
          </View>
        ))}
      </Page>

      {/* Página con los códigos QR (reverso) */}
      <Page size="A4" style={styles.qrPage}>
        {cards.map((card) => (
          <View key={`qr-${card.id}`} style={styles.qrCard}>
            {card.qrCodeDataUrl && (
              <Image style={styles.qrImage} src={card.qrCodeDataUrl} />
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
};
