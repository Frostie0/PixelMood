'use client';

import { useState, useRef } from 'react';
import { HfInference } from '@huggingface/inference';
import { createWorker } from 'tesseract.js';
import { Paperclip, Send, Loader2, X, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TextareaAutosize from "react-textarea-autosize";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import { Badge } from '@/components/ui/badge';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export default function Home() {

  const [commentText, setCommentText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY);
  const [copied, setCopied] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState('');
  const fileInputRef = useRef(null);

  // Fonction pour gérer la sélection d'image
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour supprimer l'image
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractionStatus('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour extraire le texte de l'image avec Tesseract.js
  const extractTextFromImage = async (imageFile) => {
    let worker;
    
    try {
      setExtractionStatus('Initialisation de Tesseract...');
      
      // Créer le worker avec support français et anglais (syntaxe v5)
      worker = await createWorker('fra+eng', 1, {
        logger: (m) => {
          // Afficher la progression pendant la reconnaissance
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            setExtractionStatus(`Extraction du texte... ${progress}%`);
          } else if (m.status === 'loading tesseract core') {
            setExtractionStatus('Chargement du moteur OCR...');
          } else if (m.status === 'loading language traineddata') {
            setExtractionStatus('Chargement des langues (FR/EN)...');
          }
        }
      });
      
      setExtractionStatus('Analyse de l\'image en cours...');
      
      // Convertir le fichier en URL pour Tesseract
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Extraire le texte
      const { data } = await worker.recognize(imageUrl);
      
      // Nettoyer l'URL créée
      URL.revokeObjectURL(imageUrl);
      
      setExtractionStatus('Texte extrait avec succès !');
      
      // Retourner le texte extrait
      return data.text || '';
    } catch (err) {
      console.error('Erreur extraction texte avec Tesseract:', err);
      throw new Error('Impossible d\'extraire le texte de l\'image. Assurez-vous que l\'image contient du texte lisible.');
    } finally {
      // Toujours terminer le worker pour libérer la mémoire
      if (worker) {
        await worker.terminate();
      }
    }
  };

  // Fonction pour analyser le sentiment d'un commentaire
  const analyzeSentiment = async (text) => {
    try {
      const hf = new HfInference(apiKey);

      // Utiliser le modèle d'analyse de sentiment
      const result = await hf.textClassification({
        model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        inputs: text
      });

      return {
        text: text,
        sentiment: result[0]?.label || 'unknown',
        score: result[0]?.score || 0
      };
    } catch (err) {
      console.error('Erreur analyse sentiment:', err);
      return {
        text: text,
        sentiment: 'error',
        score: 0,
        error: err.message
      };
    }
  };

  // Fonction principale pour traiter la soumission
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    setExtractionStatus('');

    try {
      if (!apiKey) {
        throw new Error('Veuillez entrer votre clé API HuggingFace');
      }

      let comments = [];

      // Si une image est sélectionnée, extraire le texte
      if (selectedImage) {
        const extractedText = await extractTextFromImage(selectedImage);
        
        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('Aucun texte détecté dans l\'image. Assurez-vous que l\'image contient du texte clair.');
        }

        // Diviser le texte en lignes/commentaires
        const lines = extractedText
          .split(/[\n\r]+/)
          .map(line => line.trim())
          .filter(line => line.length > 3); // Filtrer les lignes trop courtes
        
        comments = lines.length > 0 ? lines : [extractedText];
      }

      // Ajouter le texte saisi manuellement s'il existe
      if (commentText.trim()) {
        comments.push(commentText.trim());
      }

      if (comments.length === 0) {
        throw new Error('Veuillez entrer un commentaire ou joindre une image avec du texte');
      }

      // Analyser le sentiment de chaque commentaire
      const sentimentResults = [];
      setExtractionStatus(`Analyse de ${comments.length} commentaire(s)...`);

      for (let i = 0; i < comments.length; i++) {
        setExtractionStatus(`Analyse du commentaire ${i + 1}/${comments.length}...`);
        const analysis = await analyzeSentiment(comments[i]);
        sentimentResults.push(analysis);
      }

      setResults({
        totalComments: comments.length,
        analyzedAt: new Date().toISOString(),
        comments: sentimentResults
      });

      setCommentText('');
      setSelectedImage(null);
      setImagePreview(null);
      setExtractionStatus('');

    } catch (err) {
      setError(err.message);
      setExtractionStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour copier le JSON
  const copyToClipboard = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 ${poppins.className}`}>

      {/* Header */}
      <div className="sticky top-0 bg-neutral-900/80 backdrop-blur-md py-4 pl-5 mb-8 z-10 border-b border-orange-500/20">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">
          PixelMood
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-4">

        {/* Messages Container */}
        <div className="pb-70">

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-300 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Extraction Status */}
          {isLoading && extractionStatus && (
            <div className="mb-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-orange-400 flex-shrink-0" />
                <p className="text-sm text-orange-200">{extractionStatus}</p>
              </div>
            </div>
          )}

          {/* Results Display */}
          {results && (
            <div className="space-y-4">
              {/* Cartes de résultats */}
              {results.comments.map((comment, index) => {
                const sentiment = comment.sentiment.toLowerCase();
                let sentimentText, badgeVariant;

                if (sentiment.includes('positive') || sentiment === 'label_2') {
                  sentimentText = 'Positif';
                  badgeVariant = 'default';
                } else if (sentiment.includes('negative') || sentiment === 'label_0') {
                  sentimentText = 'Négatif';
                  badgeVariant = 'secondary';
                } else if (sentiment.includes('neutral') || sentiment === 'label_1') {
                  sentimentText = 'Neutre';
                  badgeVariant = 'outline';
                } else {
                  sentimentText = 'Erreur';
                  badgeVariant = 'destructive';
                }

                return (
                  <Card key={index} className="bg-neutral-800/50 border-orange-500/20 backdrop-blur-sm">
                    <CardContent className="pt-4">
                      <p className="text-sm mb-3 text-neutral-200 font-light">
                        {comment.text}
                      </p>

                      <div className="flex items-center gap-2">
                        <Badge variant={badgeVariant} className="font-medium">
                          {sentimentText}
                        </Badge>
                        <span className="text-xs text-neutral-400 font-light">
                          {(comment.score * 100).toFixed(0)}% confiance
                        </span>
                      </div>

                      {comment.error && (
                        <p className="text-xs text-neutral-400 mt-2 font-light">
                          {comment.error}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Affichage JSON */}
              <Card className="bg-neutral-800/50 border-orange-500/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-neutral-200 font-semibold">JSON</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyToClipboard}
                      className="bg-orange-400/50 border-orange-400/30 hover:bg-orange-400/10 text-white"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-neutral-950/50 border border-orange-500/20 p-4 rounded-lg overflow-x-auto">
                    <code className="text-orange-300 font-mono">
                      {JSON.stringify(results, null, 2)}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Input fixe en bas */}
          <div className="fixed bottom-16 left-0 right-0 bg-neutral-900/80 backdrop-blur-md p-4 border-t border-orange-500/20">
            <div className="max-w-3xl mx-auto">

              {/* Image Preview si présente */}
              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="h-20 rounded-lg border border-orange-500/30"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-neutral-800 hover:bg-neutral-700 border border-orange-500/30"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Input file caché pour la sélection d'image */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {/* Input avec boutons intégrés */}
              <div className="flex w-full gap-6">
                <InputGroup className="relative">
                  <TextareaAutosize
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoading && (commentText.trim() || selectedImage)) {
                          handleSubmit();
                        }
                      }
                    }}
                    data-slot="input-group-control"
                    className="flex field-sizing-content min-h-24 w-full resize-none rounded-xl bg-neutral-800 border border-orange-500/30 px-4 py-3 pb-12 text-base text-neutral-200 placeholder:text-neutral-500 transition-all outline-none focus:border-orange-500/50 md:text-sm font-light"
                    placeholder="Entrez votre commentaire à analyser..."
                  />

                  {/* Paperclip en bas à gauche */}
                  <InputGroupAddon className="absolute bottom-2 left-2">
                    <InputGroupButton
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      size="sm"
                      variant="ghost"
                      className="text-neutral-400 hover:text-orange-400 hover:bg-orange-500/10">
                      <Paperclip className="h-4 w-4" />
                    </InputGroupButton>
                  </InputGroupAddon>

                  {/* Bouton Send en bas à droite */}
                  <InputGroupAddon className="absolute bottom-2 right-2">
                    <InputGroupButton
                      onClick={handleSubmit}
                      disabled={isLoading || (!commentText.trim() && !selectedImage)}
                      size="sm"
                      className="bg-orange-400/50 hover:bg-orange-400/10 border-orange-400/30 text-white font-medium"
                      variant="default">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>


            </div>
          </div>


          {/* Avertissement Message */}
          <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-md py-4 px-4 z-20">
            <div className="max-w-3xl mx-auto flex items-center justify-center gap-3">
              <p className="text-xs text-center text-orange-100 font-light">
                <span className="font-semibold">Avertissement :</span> Les résultats d'analyse de sentiment sont générés par IA et peuvent ne pas toujours refléter avec précision le ton réel du message. Utilisez ces informations comme guide uniquement.
              </p>
            </div>
          </div>


        </div>

      </div>



    </div>
  );
}