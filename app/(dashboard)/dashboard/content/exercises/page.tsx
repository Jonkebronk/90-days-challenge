'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, X, Grid3x3, List, Activity, Heart, Zap, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  { id: 'chest', name: 'Bröst', icon: 'Activity', color: '#FF6B6B', muscleGroups: ['Chest'] },
  { id: 'back', name: 'Rygg', icon: 'Dumbbell', color: '#4ECDC4', muscleGroups: ['Back'] },
  { id: 'shoulders', name: 'Axlar', icon: 'Zap', color: '#95E1D3', muscleGroups: ['Shoulders'] },
  { id: 'arms', name: 'Armar', icon: 'Target', color: '#F38181', muscleGroups: ['Biceps', 'Triceps'] },
  { id: 'legs', name: 'Ben', icon: 'Heart', color: '#AA96DA', muscleGroups: ['Legs', 'Quads', 'Hamstrings', 'Glutes', 'Calves'] },
  { id: 'core', name: 'Core & Mage', icon: 'Activity', color: '#FCBAD3', muscleGroups: ['Abs', 'Core'] }
]

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<string>('all')
  const [filterEquipment, setFilterEquipment] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [showCategoryView, setShowCategoryView] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
  }, [exercises, searchTerm, filterMuscleGroup, filterEquipment, filterDifficulty])

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

    if (filterDifficulty && filterDifficulty !== 'all') {
      filtered = filtered.filter(ex =>
        ex.difficultyLevel?.toLowerCase() === filterDifficulty.toLowerCase()
      )
    }

    setFilteredExercises(filtered)
  }

  const handleCategoryClick = (categoryId: string) => {
    const category = MUSCLE_GROUP_CATEGORIES.find(c => c.id === categoryId)
    if (category) {
      setSelectedCategory(categoryId)
      setShowCategoryView(false)
      // Set filter to first muscle group in the category
      if (category.muscleGroups.length > 0) {
        setFilterMuscleGroup(category.muscleGroups[0].toLowerCase())
      }
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      Activity,
      Dumbbell,
      Zap,
      Target,
      Heart
    }
    return icons[iconName] || Activity
  }

  const getCategoryExerciseCount = (category: typeof MUSCLE_GROUP_CATEGORIES[0]) => {
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
    if (instructionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, instructionInput.trim()]
      }))
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Övningsbank
          </h1>
          <p className="text-gray-600 mt-1">
            Hantera övningar för träningsprogram
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            <Button
              variant={showCategoryView ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setShowCategoryView(true)
                setSelectedCategory(null)
                setFilterMuscleGroup('all')
              }}
              className={showCategoryView ? "bg-gradient-to-r from-gold-primary to-gold-secondary text-white" : "text-gray-600 hover:text-gray-900"}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Kategorier
            </Button>
            <Button
              variant={!showCategoryView ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowCategoryView(false)}
              className={!showCategoryView ? "bg-gradient-to-r from-gold-primary to-gold-secondary text-white" : "text-gray-600 hover:text-gray-900"}
            >
              <List className="w-4 h-4 mr-2" />
              Alla övningar
            </Button>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lägg till övning
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-gray-700">Sök</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Sök övning..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Muskelgrupp</Label>
              <Select value={filterMuscleGroup} onValueChange={setFilterMuscleGroup}>
                <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Alla muskelgrupper" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla muskelgrupper</SelectItem>
                  {MUSCLE_GROUPS.map(muscle => (
                    <SelectItem key={muscle} value={muscle}>{muscle}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700">Utrustning</Label>
              <Select value={filterEquipment} onValueChange={setFilterEquipment}>
                <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="All utrustning" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All utrustning</SelectItem>
                  {EQUIPMENT_OPTIONS.map(equip => (
                    <SelectItem key={equip} value={equip}>{equip}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700">Svårighet</Label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Alla nivåer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla nivåer</SelectItem>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level} value={level.toLowerCase()}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Cards View */}
      {showCategoryView && !selectedCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MUSCLE_GROUP_CATEGORIES.map((category) => {
            const Icon = getIconComponent(category.icon)
            const exerciseCount = getCategoryExerciseCount(category)

            return (
              <Card
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-white border border-gray-200 hover:border-[rgba(255,215,0,0.4)] cursor-pointer transition-all group hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${category.color}22, ${category.color}11)`
                    }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{ color: category.color }}
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {exerciseCount} övningar
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <>
          {/* Back to Categories Button */}
          {!showCategoryView && selectedCategory && (
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryView(true)
                setSelectedCategory(null)
                setFilterMuscleGroup('all')
              }}
              className="mb-4"
            >
              ← Tillbaka till kategorier
            </Button>
          )}

          {/* Exercises Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((exercise) => (
          <Card
            key={exercise.id}
            className="bg-white border border-gray-200 hover:border-[rgba(255,215,0,0.4)] transition-all"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-light to-orange-500 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-[#0a0a0a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-100 break-words">
                      {exercise.name}
                    </CardTitle>
                    {exercise.category && (
                      <p className="text-xs text-gray-500 mt-1">
                        {exercise.category}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(exercise)}
                    className="h-8 w-8 text-[rgba(255,215,0,0.8)] hover:text-gold-light hover:bg-gold-50"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(exercise.id)}
                    className="h-8 w-8 text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {exercise.muscleGroups.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Muskelgrupper:</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.map(muscle => (
                      <Badge
                        key={muscle}
                        variant="outline"
                        className="text-xs bg-[rgba(255,215,0,0.1)] border-gold-primary/30 text-gold-light"
                      >
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {exercise.equipmentNeeded.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Utrustning:</p>
                  <div className="flex flex-wrap gap-1">
                    {exercise.equipmentNeeded.map(equipment => (
                      <Badge
                        key={equipment}
                        variant="outline"
                        className="text-xs bg-[rgba(100,150,255,0.1)] border-[rgba(100,150,255,0.3)] text-[#6496ff]"
                      >
                        {equipment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {exercise.difficultyLevel && (
                <Badge
                  className={`text-xs ${
                    exercise.difficultyLevel.toLowerCase() === 'beginner'
                      ? 'bg-[rgba(40,167,69,0.2)] text-[#28a745] border-[rgba(40,167,69,0.3)]'
                      : exercise.difficultyLevel.toLowerCase() === 'intermediate'
                      ? 'bg-[rgba(255,193,7,0.2)] text-[#ffc107] border-[rgba(255,193,7,0.3)]'
                      : 'bg-[rgba(220,53,69,0.2)] text-[#dc3545] border-[rgba(220,53,69,0.3)]'
                  }`}
                >
                  {exercise.difficultyLevel}
                </Badge>
              )}

              {exercise.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {exercise.description}
                </p>
              )}
            </CardContent>
          </Card>
            ))}
          </div>

          {filteredExercises.length === 0 && (
            <Card className="bg-white border border-gray-200">
              <CardContent className="py-12 text-center">
                <Dumbbell className="w-12 h-12 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
                <p className="text-gray-400">
                  Inga övningar hittades. Skapa din första övning!
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

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
              <Label className="text-gray-700">Övningsnamn *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="T.ex. Barbell Bench Press"
                className="bg-white border-gray-300 text-gray-900 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Kategori</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Välj kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700">Svårighetsgrad</Label>
                <Select value={formData.difficultyLevel} onValueChange={(value) => setFormData({ ...formData, difficultyLevel: value })}>
                  <SelectTrigger className="mt-1 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Välj svårighet" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map(level => (
                      <SelectItem key={level} value={level.toLowerCase()}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Muskelgrupper</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MUSCLE_GROUPS.map(muscle => (
                  <Badge
                    key={muscle}
                    onClick={() => toggleMuscleGroup(muscle)}
                    className={`cursor-pointer transition-all ${
                      formData.muscleGroups.includes(muscle)
                        ? 'bg-[rgba(255,215,0,0.3)] border-[rgba(255,215,0,0.5)] text-gold-light'
                        : 'bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-gray-500 hover:bg-gold-50'
                    }`}
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Utrustning</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {EQUIPMENT_OPTIONS.map(equipment => (
                  <Badge
                    key={equipment}
                    onClick={() => toggleEquipment(equipment)}
                    className={`cursor-pointer transition-all ${
                      formData.equipmentNeeded.includes(equipment)
                        ? 'bg-[rgba(100,150,255,0.3)] border-[rgba(100,150,255,0.5)] text-[#6496ff]'
                        : 'bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-gray-500 hover:bg-gold-50'
                    }`}
                  >
                    {equipment}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Beskrivning</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskriv övningen..."
                rows={3}
                className="bg-white border-gray-300 text-gray-900 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700">Video URL</Label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="YouTube/Vimeo URL"
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                />
              </div>

              <div>
                <Label className="text-gray-700">Thumbnail URL</Label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="Image URL"
                  className="bg-white border-gray-300 text-gray-900 mt-1"
                />
              </div>
            </div>

            {/* Video Preview */}
            {formData.videoUrl && (
              <div>
                <Label className="text-gray-700 mb-2 block">Videoförhandsvisning:</Label>
                <VideoPlayer
                  videoUrl={formData.videoUrl}
                  thumbnailUrl={formData.thumbnailUrl}
                  title={formData.name || 'Exercise video'}
                  className="w-full max-w-md"
                />
              </div>
            )}

            <div>
              <Label className="text-gray-700">Instruktioner</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={instructionInput}
                  onChange={(e) => setInstructionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInstruction())}
                  placeholder="Lägg till instruktion..."
                  className="bg-white border-gray-300 text-gray-900"
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
              className="border-gold-primary/20 text-gray-700 hover:bg-gold-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name}
              className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90"
            >
              {editingExercise ? 'Uppdatera' : 'Skapa'} övning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
