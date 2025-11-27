'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, X, Video, ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VideoPlayer } from '@/components/ui/video-player'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Exercise {
  id: string
  name: string
  category: string | null
  muscleGroups: string[]
  equipmentNeeded: string[]
  difficultyLevel: string | null
  description: string | null
  videoUrl: string | null
  instructions: string[]
  thumbnailUrl: string | null
}

const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Core'
]

const EQUIPMENT_OPTIONS = [
  'Bodyweight', 'Barbell', 'Dumbbell', 'Kettlebell', 'Cable',
  'Machine', 'Bench', 'Pull-up bar', 'Resistance band', 'TRX'
]

const CATEGORIES = ['Strength', 'Cardio', 'Flexibility', 'Mobility', 'Plyometric']
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const MUSCLE_GROUP_CATEGORIES = [
  { id: 'all', name: 'Alla', muscleGroups: [] },
  { id: 'chest', name: 'Bröst', muscleGroups: ['Chest'] },
  { id: 'back', name: 'Rygg', muscleGroups: ['Back'] },
  { id: 'shoulders', name: 'Axlar', muscleGroups: ['Shoulders'] },
  { id: 'arms', name: 'Armar', muscleGroups: ['Biceps', 'Triceps'] },
  { id: 'legs', name: 'Ben', muscleGroups: ['Legs', 'Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { id: 'core', name: 'Core', muscleGroups: ['Abs', 'Core'] }
]

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('all')
  const [filterCategoryMuscleGroups, setFilterCategoryMuscleGroups] = useState<string[]>([])
  const [filterEquipment, setFilterEquipment] = useState<string>('all')
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    muscleGroups: [] as string[],
    equipmentNeeded: [] as string[],
    difficultyLevel: '',
    description: '',
    videoUrl: '',
    instructions: [] as string[],
    thumbnailUrl: ''
  })

  const [instructionInput, setInstructionInput] = useState('')

  useEffect(() => {
    fetchExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchTerm, filterMuscleGroup, filterCategoryMuscleGroups, filterEquipment, selectedCategoryTab])

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    if (searchTerm) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category tab
    if (selectedCategoryTab && selectedCategoryTab !== 'all') {
      const category = MUSCLE_GROUP_CATEGORIES.find(c => c.id === selectedCategoryTab)
      if (category && category.muscleGroups.length > 0) {
        filtered = filtered.filter(ex =>
          ex.muscleGroups.some(muscle =>
            category.muscleGroups.some(catMuscle =>
              muscle.toLowerCase() === catMuscle.toLowerCase()
            )
          )
        )
      }
    }

    // Additional muscle group filter (dropdown)
    if (filterMuscleGroup && filterMuscleGroup !== 'all') {
      filtered = filtered.filter(ex =>
        ex.muscleGroups.some(muscle =>
          muscle.toLowerCase() === filterMuscleGroup.toLowerCase()
        )
      )
    }

    if (filterEquipment && filterEquipment !== 'all') {
      filtered = filtered.filter(ex =>
        ex.equipmentNeeded.some(equip =>
          equip.toLowerCase() === filterEquipment.toLowerCase()
        )
      )
    }

    setFilteredExercises(filtered)
  }

  const handleCategoryTabClick = (categoryId: string) => {
    setSelectedCategoryTab(categoryId)
    // Reset other filters when changing category
    setFilterMuscleGroup('all')
  }

  const getCategoryExerciseCount = (category: typeof MUSCLE_GROUP_CATEGORIES[0]) => {
    if (category.id === 'all') {
      return exercises.length
    }
    return exercises.filter(ex =>
      category.muscleGroups.some(mg =>
        ex.muscleGroups.some(emg => emg.toLowerCase() === mg.toLowerCase())
      )
    ).length
  }

  const handleOpenDialog = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise)
      setFormData({
        name: exercise.name,
        category: exercise.category || '',
        muscleGroups: exercise.muscleGroups,
        equipmentNeeded: exercise.equipmentNeeded,
        difficultyLevel: exercise.difficultyLevel || '',
        description: exercise.description || '',
        videoUrl: exercise.videoUrl || '',
        instructions: exercise.instructions,
        thumbnailUrl: exercise.thumbnailUrl || ''
      })
    } else {
      setEditingExercise(null)
      setFormData({
        name: '',
        category: '',
        muscleGroups: [],
        equipmentNeeded: [],
        difficultyLevel: '',
        description: '',
        videoUrl: '',
        instructions: [],
        thumbnailUrl: ''
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingExercise(null)
    setInstructionInput('')
  }

  const handleSubmit = async () => {
    try {
      const url = editingExercise
        ? `/api/exercises/${editingExercise.id}`
        : '/api/exercises'

      const method = editingExercise ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchExercises()
        handleCloseDialog()
      }
    } catch (error) {
      console.error('Error saving exercise:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna övning?')) return

    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchExercises()
      }
    } catch (error) {
      console.error('Error deleting exercise:', error)
    }
  }

  const toggleMuscleGroup = (muscle: string) => {
    setFormData(prev => ({
      ...prev,
      muscleGroups: prev.muscleGroups.includes(muscle)
        ? prev.muscleGroups.filter(m => m !== muscle)
        : [...prev.muscleGroups, muscle]
    }))
  }

  const toggleEquipment = (equipment: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentNeeded: prev.equipmentNeeded.includes(equipment)
        ? prev.equipmentNeeded.filter(e => e !== equipment)
        : [...prev.equipmentNeeded, equipment]
    }))
  }

  const addInstruction = () => {
    const trimmed = instructionInput.trim()
    if (trimmed) {
      setFormData(prev => {
        const newInstructions = [...prev.instructions, trimmed]
        console.log('Adding instruction:', trimmed, 'Total:', newInstructions.length)
        return {
          ...prev,
          instructions: newInstructions
        }
      })
      setInstructionInput('')
    }
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Övningsbank
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Hantera övningar för träningsprogram
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {MUSCLE_GROUP_CATEGORIES.map((category) => {
          const count = getCategoryExerciseCount(category)
          const isActive = selectedCategoryTab === category.id

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryTabClick(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-gold-primary to-gold-secondary text-[#0a0a0a]'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-gold-primary/20'
              }`}
            >
              {category.name}
              <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                isActive ? 'bg-black/20' : 'bg-white/10'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white/5 border border-gold-primary/20 rounded-lg p-4">
        {/* Exercise Count */}
        <span className="text-gray-400 text-sm whitespace-nowrap">
          Visar {filteredExercises.length} övningar
        </span>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sök övning..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-gold-primary/20 text-white h-9"
          />
        </div>

        {/* Muscle Group Filter */}
        <Select value={filterMuscleGroup} onValueChange={setFilterMuscleGroup}>
          <SelectTrigger className="w-[180px] bg-white/5 border-gold-primary/20 text-white h-9">
            <SelectValue placeholder="Muskelgrupp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla muskelgrupper</SelectItem>
            {MUSCLE_GROUPS.map(muscle => (
              <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Equipment Filter */}
        <Select value={filterEquipment} onValueChange={setFilterEquipment}>
          <SelectTrigger className="w-[180px] bg-white/5 border-gold-primary/20 text-white h-9">
            <SelectValue placeholder="Utrustning" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All utrustning</SelectItem>
            {EQUIPMENT_OPTIONS.map(equip => (
              <SelectItem key={equip} value={equip}>{equip}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add Exercise Button */}
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-[#0a0a0a] font-semibold h-9"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till övning
        </Button>
      </div>

      {/* Exercise Table */}
      <Card className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gold-primary/20 hover:bg-transparent">
              <TableHead className="text-gray-400 font-medium">Namn</TableHead>
              <TableHead className="text-gray-400 font-medium w-[100px]">Content</TableHead>
              <TableHead className="text-gray-400 font-medium">Muskelgrupp</TableHead>
              <TableHead className="text-gray-400 font-medium">Utrustning</TableHead>
              <TableHead className="text-gray-400 font-medium w-[100px] text-right">Åtgärder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExercises.map((exercise) => (
              <TableRow
                key={exercise.id}
                className="border-gold-primary/10 hover:bg-white/5 transition-colors"
              >
                {/* Name with Thumbnail */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {exercise.thumbnailUrl ? (
                      <img
                        src={exercise.thumbnailUrl}
                        alt={exercise.name}
                        className="w-10 h-10 rounded object-cover bg-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <span className="text-gray-100">{exercise.name}</span>
                  </div>
                </TableCell>

                {/* Content Icons */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {exercise.videoUrl && (
                      <Video className="w-4 h-4 text-gold-primary" />
                    )}
                    {exercise.thumbnailUrl && (
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    )}
                    {!exercise.videoUrl && !exercise.thumbnailUrl && (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </TableCell>

                {/* Muscle Groups */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.slice(0, 2).map(mg => (
                      <Badge
                        key={mg}
                        variant="outline"
                        className="text-xs bg-gold-primary/10 border-gold-primary/30 text-gold-light"
                      >
                        {mg}
                      </Badge>
                    ))}
                    {exercise.muscleGroups.length > 2 && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-white/5 border-gray-600 text-gray-400"
                      >
                        +{exercise.muscleGroups.length - 2}
                      </Badge>
                    )}
                    {exercise.muscleGroups.length === 0 && (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </TableCell>

                {/* Equipment */}
                <TableCell className="text-gray-300">
                  {exercise.equipmentNeeded.length > 0
                    ? exercise.equipmentNeeded.join(', ')
                    : <span className="text-gray-500">-</span>
                  }
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(exercise)}
                      className="h-8 w-8 text-gold-primary/80 hover:text-gold-light hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(exercise.id)}
                      className="h-8 w-8 text-red-400/80 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredExercises.length === 0 && (
          <div className="py-12 text-center">
            <Dumbbell className="w-12 h-12 text-gold-primary/30 mx-auto mb-4" />
            <p className="text-gray-400">
              Inga övningar hittades. Skapa din första övning!
            </p>
          </div>
        )}
      </Card>

      {/* Exercise Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900/95 border-gold-primary/30">
          <DialogHeader>
            <DialogTitle className="text-gray-100">
              {editingExercise ? 'Redigera övning' : 'Lägg till övning'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Övningsnamn *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="T.ex. Barbell Bench Press"
                className="bg-white/5 border-gold-primary/20 text-white placeholder:text-gray-500 mt-1"
              />
            </div>

            <div>
              <Label className="text-gray-300">Muskelgrupper</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MUSCLE_GROUPS.map(muscle => (
                  <Badge
                    key={muscle}
                    onClick={() => toggleMuscleGroup(muscle)}
                    className={`cursor-pointer transition-all ${
                      formData.muscleGroups.includes(muscle)
                        ? 'bg-[rgba(255,215,0,0.3)] border-[rgba(255,215,0,0.5)] text-gold-light'
                        : 'bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-gray-400 hover:bg-gold-primary/10'
                    }`}
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Video URL</Label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="YouTube/Vimeo URL"
                  className="bg-white/5 border-gold-primary/20 text-white placeholder:text-gray-500 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-300">Thumbnail URL</Label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="Image URL"
                  className="bg-white/5 border-gold-primary/20 text-white placeholder:text-gray-500 mt-1"
                />
              </div>
            </div>

            {/* Video Preview */}
            {formData.videoUrl && (
              <div>
                <Label className="text-gray-300 mb-2 block">Videoförhandsvisning:</Label>
                <VideoPlayer
                  videoUrl={formData.videoUrl}
                  thumbnailUrl={formData.thumbnailUrl}
                  title={formData.name || 'Exercise video'}
                  className="w-full max-w-md"
                />
              </div>
            )}

            <div>
              <Label className="text-gray-300">Instruktioner</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={instructionInput}
                  onChange={(e) => setInstructionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addInstruction()
                    }
                  }}
                  placeholder="Lägg till instruktion..."
                  className="bg-white/5 border-gold-primary/20 text-white placeholder:text-gray-500"
                />
                <Button
                  type="button"
                  onClick={addInstruction}
                  className="bg-[rgba(255,215,0,0.2)] border border-gold-primary/30 text-gold-light hover:bg-[rgba(255,215,0,0.3)]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.instructions.length > 0 && (
                <div className="space-y-2 mt-3">
                  {formData.instructions.map((instruction, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 bg-[rgba(255,255,255,0.05)] p-2 rounded border border-gold-primary/20"
                    >
                      <span className="text-[rgba(255,215,0,0.7)] text-sm font-medium">
                        {index + 1}.
                      </span>
                      <p className="text-gray-200 text-sm flex-1">
                        {instruction}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInstruction(index)}
                        className="h-6 w-6 text-[rgba(255,100,100,0.8)] hover:text-[#ff6464]"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              className="border-gold-primary/20 text-gray-300 hover:bg-white/10"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name}
              className="bg-gradient-to-r from-gold-primary to-gold-secondary text-[#0a0a0a] hover:opacity-90 disabled:opacity-50"
            >
              {editingExercise ? 'Uppdatera' : 'Skapa'} övning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
