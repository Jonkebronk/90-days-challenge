import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { RecipeInstruction } from './types'

interface InstructionListProps {
  instructions: RecipeInstruction[]
  onAdd: (instruction: Partial<RecipeInstruction>) => void
  onUpdate: (id: string, field: keyof RecipeInstruction, value: any) => void
  onDelete: (id: string) => void
}

export function InstructionList({ instructions, onAdd, onUpdate, onDelete }: InstructionListProps) {
  const [newInstruction, setNewInstruction] = useState('')

  const handleAdd = () => {
    if (!newInstruction.trim()) {
      return
    }

    onAdd({
      instruction: newInstruction,
      stepNumber: instructions.length + 1,
      duration: null,
      imageUrl: null
    })

    setNewInstruction('')
  }

  return (
    <div className="space-y-4">
      {/* Existing Instructions */}
      {instructions
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((instruction, index) => (
          <div
            key={instruction.id}
            className="p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,215,0,0.1)] rounded-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] flex items-center justify-center">
                <span className="text-[#FFD700] font-semibold text-sm">
                  {instruction.stepNumber}
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <Textarea
                  value={instruction.instruction}
                  onChange={(e) => onUpdate(instruction.id, 'instruction', e.target.value)}
                  placeholder="Beskriv detta steg..."
                  rows={3}
                  className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white resize-none"
                />

                <div className="flex items-center gap-2">
                  <label className="text-xs text-[rgba(255,255,255,0.6)]">
                    Valfri tid (minuter):
                  </label>
                  <Input
                    type="number"
                    value={instruction.duration || ''}
                    onChange={(e) => onUpdate(instruction.id, 'duration', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="15"
                    className="w-24 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(instruction.id)}
                className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

      {/* Add New Instruction */}
      <div className="p-4 bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,215,0,0.1)] rounded-lg">
        <h4 className="text-sm font-medium text-[rgba(255,255,255,0.9)] mb-3">
          Lägg till steg {instructions.length + 1}
        </h4>
        <Textarea
          value={newInstruction}
          onChange={(e) => setNewInstruction(e.target.value)}
          placeholder="Beskriv detta steg..."
          rows={3}
          className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white resize-none mb-3"
        />
        <Button
          onClick={handleAdd}
          disabled={!newInstruction.trim()}
          className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till steg
        </Button>
      </div>
    </div>
  )
}
