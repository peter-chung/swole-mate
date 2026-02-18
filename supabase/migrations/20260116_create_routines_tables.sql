-- Create routines table
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create routine_exercises table
CREATE TABLE IF NOT EXISTS public.routine_exercises (
  id BIGSERIAL NOT NULL,
  routine_id UUID,
  public_exercise_id TEXT,
  custom_exercise_id TEXT,
  user_id UUID,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (routine_id) REFERENCES public.routines(id) ON DELETE CASCADE,
  FOREIGN KEY (public_exercise_id) REFERENCES public.public_exercises(id) ON DELETE SET NULL,
  FOREIGN KEY (custom_exercise_id) REFERENCES public.custom_exercises(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create routine_sets table
CREATE TABLE IF NOT EXISTS public.routine_sets (
  id BIGSERIAL NOT NULL,
  routine_exercise_id BIGINT,
  user_id UUID,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight NUMERIC,
  duration INTERVAL,
  distance NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (routine_exercise_id) REFERENCES public.routine_exercises(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for routines table
CREATE POLICY "Users can view their own routines" 
  ON public.routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create routines" 
  ON public.routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" 
  ON public.routines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" 
  ON public.routines FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for routine_exercises table
CREATE POLICY "Users can view routine exercises for their routines" 
  ON public.routine_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create routine exercises" 
  ON public.routine_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their routine exercises" 
  ON public.routine_exercises FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their routine exercises" 
  ON public.routine_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for routine_sets table
CREATE POLICY "Users can view routine sets for their exercises" 
  ON public.routine_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create routine sets" 
  ON public.routine_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their routine sets" 
  ON public.routine_sets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their routine sets" 
  ON public.routine_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routine_exercises_routine_id ON public.routine_exercises(routine_id);
CREATE INDEX idx_routine_exercises_user_id ON public.routine_exercises(user_id);
CREATE INDEX idx_routine_sets_routine_exercise_id ON public.routine_sets(routine_exercise_id);
CREATE INDEX idx_routine_sets_user_id ON public.routine_sets(user_id);
