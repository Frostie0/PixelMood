'use client';

import { useState, useRef } from 'react';
import { HfInference } from '@huggingface/inference';
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
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || '');
  const [copied, setCopied] = useState(false);
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour extraire le texte de l'image avec HuggingFace
  const extractTextFromImage = async (imageFile) => {
    try {
      const hf = new HfInference(apiKey);

      // Convertir l'image en blob
      const imageBlob = await imageFile.arrayBuffer();

      // Utiliser le modèle OCR de HuggingFace
      const result = await hf.imageToText({
        data: imageBlob,
        model: 'Salesforce/blip-image-captioning-large'
      });

      return result.generated_text || '';
    } catch (err) {
      console.error('Erreur extraction texte:', err);
      throw new Error('Impossible d\'extraire le texte de l\'image');
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

    try {
      if (!apiKey) {
        throw new Error('Veuillez entrer votre clé API HuggingFace');
      }

      let comments = [];

      // Si une image est sélectionnée, extraire le texte
      if (selectedImage) {
        const extractedText = await extractTextFromImage(selectedImage);
        // Diviser le texte en lignes/commentaires
        const lines = extractedText.split('\n').filter(line => line.trim());
        comments = lines.length > 0 ? lines : [extractedText];
      }

      // Ajouter le texte saisi manuellement s'il existe
      if (commentText.trim()) {
        comments.push(commentText.trim());
      }

      if (comments.length === 0) {
        throw new Error('Veuillez entrer un commentaire ou joindre une image');
      }

      // Analyser le sentiment de chaque commentaire
      const sentimentResults = [];

      for (const comment of comments) {
        const analysis = await analyzeSentiment(comment);
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

    } catch (err) {
      setError(err.message);
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
              {error}
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
                      onClick={() => fileInputRef.current?.click()}
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