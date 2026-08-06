import { supabase } from './supabase';
import type { Course, Lesson, Module } from './db-types';

export async function listCourses(): Promise<Course[]> {
  const { data, error } = await supabase.from('courses').select('*').order('sort_order');
  if (error) throw error;
  return data as Course[];
}

export async function listModules(courseId: string): Promise<Module[]> {
  const { data, error } = await supabase.from('modules').select('*').eq('course_id', courseId).order('sort_order');
  if (error) throw error;
  return data as Module[];
}

export async function listLessons(moduleId: string): Promise<Lesson[]> {
  const { data, error } = await supabase.from('lessons').select('*').eq('module_id', moduleId).order('sort_order');
  if (error) throw error;
  return data as Lesson[];
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single();
  if (error) throw error;
  return data as Lesson;
}

export async function createCourse(course: Partial<Course>): Promise<Course> {
  const { data, error } = await supabase.from('courses').insert(course).select().single();
  if (error) throw error;
  return data as Course;
}

export async function updateCourse(id: string, patch: Partial<Course>): Promise<void> {
  const { error } = await supabase.from('courses').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

export async function createModule(mod: Partial<Module>): Promise<Module> {
  const { data, error } = await supabase.from('modules').insert(mod).select().single();
  if (error) throw error;
  return data as Module;
}

export async function updateModule(id: string, patch: Partial<Module>): Promise<void> {
  const { error } = await supabase.from('modules').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteModule(id: string): Promise<void> {
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) throw error;
}

export async function createLesson(lesson: Partial<Lesson>): Promise<Lesson> {
  const { data, error } = await supabase.from('lessons').insert(lesson).select().single();
  if (error) throw error;
  return data as Lesson;
}

export async function updateLesson(id: string, patch: Partial<Lesson>): Promise<void> {
  const { error } = await supabase.from('lessons').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from('lessons').delete().eq('id', id);
  if (error) throw error;
}
