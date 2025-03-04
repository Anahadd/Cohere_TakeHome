'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { MessageCircle, BarChart2, BarChart, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Persona {
  _id: string;
  name: string;
  description: string;
  personality: string;
  avatar: string;
}

interface PersonaStats {
  totalChats: number;
  totalMessages: number;
  avgCosineSimilarity: number;
  avgResponseTime: number;
  lastActive: string;
}

export function PersonaList() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaStats, setPersonaStats] = useState<Record<string, PersonaStats>>({});
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personas');
      if (!response.ok) {
        throw new Error('Failed to fetch personas');
      }
      const data = await response.json();
      setPersonas(data);
      
      // Fetch stats for each persona
      const statsPromises = data.map(async (persona: Persona) => {
        try {
          const statsResponse = await fetch(`/api/personas/${persona._id}/stats`);
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            return { id: persona._id, stats: statsData };
          }
          return { 
            id: persona._id, 
            stats: { 
              totalChats: 0, 
              totalMessages: 0, 
              avgCosineSimilarity: 0, 
              avgResponseTime: 0,
              lastActive: new Date().toISOString()
            } 
          };
        } catch (error) {
          console.error(`Error fetching stats for persona ${persona._id}:`, error);
          return { 
            id: persona._id, 
            stats: { 
              totalChats: 0, 
              totalMessages: 0, 
              avgCosineSimilarity: 0, 
              avgResponseTime: 0,
              lastActive: new Date().toISOString()
            } 
          };
        }
      });
      
      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, PersonaStats> = {};
      
      statsResults.forEach(result => {
        statsMap[result.id] = result.stats;
      });
      
      setPersonaStats(statsMap);
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePersonaClick = (personaId: string) => {
    // Navigate to the existing chat tab but with this persona selected
    router.push(`/chat?personaId=${personaId}`);
  };

  const openDeleteDialog = (e: React.MouseEvent, persona: Persona) => {
    e.stopPropagation();
    setPersonaToDelete(persona);
    setIsDeleteDialogOpen(true);
  };

  const deletePersona = async () => {
    if (!personaToDelete) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/personas/${personaToDelete._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete persona');
      }

      // Remove persona from state
      setPersonas(personas.filter(p => p._id !== personaToDelete._id));
      toast.success(`${personaToDelete.name} has been deleted successfully`);
    } catch (error) {
      console.error('Error deleting persona:', error);
      toast.error(`Failed to delete ${personaToDelete.name}`);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setPersonaToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Available AI Personas</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-lg">Loading personas...</div>
        </div>
      ) : personas.length === 0 ? (
        <div className="text-center p-10 bg-gray-800/30 rounded-lg">
          <p className="text-lg mb-4">No AI personas found in the database.</p>
          <p className="text-sm text-gray-400">Personas are created from your preferences.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {personas.map((persona) => {
            const stats = personaStats[persona._id] || {
              totalChats: 0,
              totalMessages: 0,
              avgCosineSimilarity: 0,
              avgResponseTime: 0,
              lastActive: new Date().toISOString()
            };
            
            // Format description and personality for better display
            const description = persona.description || "No description available";
            const personality = persona.personality || "Standard AI personality";
            
            return (
              <Card
                key={persona._id}
                className="border border-purple-900/20 overflow-hidden"
              >
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => handlePersonaClick(persona._id)}
                >
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-700 flex items-center justify-center text-white">
                        {persona.avatar ? (
                          <img
                            src={persona.avatar}
                            alt={persona.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          persona.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xl">{persona.name}</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-gray-400 hover:text-red-500 hover:bg-gray-800"
                      onClick={(e) => openDeleteDialog(e, persona)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300 mb-3">{description}</p>
                  <p className="text-sm italic text-gray-400 mb-6">"{personality.length > 100 ? personality.substring(0, 97) + '...' : personality}"</p>
                  
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Persona Statistics
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Cosine Similarity</span>
                          <span className="text-xs text-purple-300">{(stats.avgCosineSimilarity * 100).toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={stats.avgCosineSimilarity * 100} 
                          className="h-1.5" 
                          indicatorClassName="bg-purple-500" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-400">Total Chats</p>
                          <p className="text-white font-medium">{stats.totalChats}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Total Messages</p>
                          <p className="text-white font-medium">{stats.totalMessages}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Avg Response Time</p>
                          <p className="text-white font-medium">
                            {stats.avgResponseTime > 0 
                              ? `${stats.avgResponseTime.toFixed(0)}ms` 
                              : '0ms'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400">Last Active</p>
                          <p className="text-white font-medium">
                            {new Date(stats.lastActive).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <Button 
                      className="w-full"
                      onClick={() => handlePersonaClick(persona._id)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Chat
                    </Button>
                    <Link href={`/admin/outputs/${persona._id}`} className="w-full">
                      <Button className="w-full" variant="outline">
                        <BarChart className="mr-2 h-4 w-4" />
                        Outputs
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete AI Persona
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{personaToDelete?.name}</span>? 
              This action cannot be undone and will remove all related chat histories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePersona}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 